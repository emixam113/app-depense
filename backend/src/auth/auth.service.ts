import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { UserService } from '../user/user.service';
import { User } from '../user/entity/user.entity';
import { SignupDTO } from './DTO/Signup.dto';
import { LoginDto } from './DTO/login.dto';
import { ResetPasswordDto } from './DTO/reset-password.dto';
import { MailService } from '../mail/mail.service';
import { ResetTokenService } from './reset-token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly resetTokenService: ResetTokenService,
    private readonly userService: UserService
  ) {}

  async signup(signupDTO: SignupDTO): Promise<{ access_token: string }> {
    const { email, password, confirmPassword, firstName, lastName, birthDate } = signupDTO;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords are not the same');
    }

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await argon2.hash(password);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      birthDate,
    });

    await this.userRepository.save(user);

    return this.generateJwt(user);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    console.log(`Tentative de connexion pour l'email: ${email}`);

    // Récupérer l'utilisateur avec tous les champs nécessaires
    const user = await this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName']
    });
    
    if (!user) {
      console.error(`Échec de connexion: Aucun utilisateur trouvé avec l'email ${email}`);
      throw new BadRequestException('Identifiants invalides');
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      console.error(`Échec de connexion: Mot de passe incorrect pour l'utilisateur ${email}`);
      throw new BadRequestException('Identifiants invalides');
    }

    console.log(`Connexion réussie pour l'utilisateur ${email}`);
    const payload = { 
      sub: user.id, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstName,
        lastname: user.lastName
      }
    };
  }

  async requestPasswordReset(email: string, birthdate: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Données reçues - email:', email, 'birthdate:', birthdate, 'type:', typeof birthdate);
      
      // Vérifier que birthdate est défini et n'est pas vide
      if (!birthdate || typeof birthdate !== 'string' || birthdate.trim() === '') {
        console.log('Date de naissance manquante ou invalide');
        return { success: false, message: 'La date de naissance est requise' };
      }
      
      // Valider le format de la date
      // Accepter à la fois les séparateurs '/' et '-'
      const separator = birthdate.includes('/') ? '/' : '-';
      const [day, month, year] = birthdate.split(separator).map(Number);
      
      // Vérifier que la date est valide
      if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
        console.log(`Format de date invalide (attendu JJ-MM-AAAA ou JJ/MM/AAAA): ${birthdate}`);
        return { success: false, message: 'Format de date invalide. Utilisez le format JJ-MM-AAAA ou JJ/MM/AAAA' };
      }
      
      // Créer une date en UTC (mois est 0-indexé, donc on soustrait 1)
      const birthDateObj = new Date(Date.UTC(year, month - 1, day));
      
      // Vérifier que la date est valide
      if (isNaN(birthDateObj.getTime()) || 
          birthDateObj.getUTCDate() !== day || 
          birthDateObj.getUTCMonth() !== month - 1 || 
          birthDateObj.getUTCFullYear() !== year) {
        console.log(`Date invalide: ${day}/${month}/${year}`);
        return { success: false, message: 'Date de naissance invalide' };
      }
      
      // Formater la date en YYYY-MM-DD pour la comparaison
      const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      console.log('Date formatée pour la comparaison (YYYY-MM-DD):', formattedDate);
      
      // Vérifier que l'utilisateur existe d'abord
      const user = await this.userRepository.findOne({ 
        where: { email },
        select: ['id', 'email', 'firstName', 'birthDate']
      });
      
      console.log('Utilisateur trouvé:', !!user);
      
      // Vérifier si l'utilisateur existe
      if (!user) {
        console.log(`Tentative de réinitialisation pour un email inconnu: ${email}`);
        throw new NotFoundException('Aucun compte trouvé avec cet email');
      }
      
      // Formater la date de la base de données au même format
      const dbDate = new Date(user.birthDate);
      const dbFormattedDate = [
        dbDate.getUTCFullYear(),
        String(dbDate.getUTCMonth() + 1).padStart(2, '0'),
        String(dbDate.getUTCDate()).padStart(2, '0')
      ].join('-')
      
      console.log('Date de naissance en base pour cet utilisateur:', dbFormattedDate);
      
      // Vérifier si la date de naissance correspond
      if (formattedDate !== dbFormattedDate) {
        console.log(`Date de naissance incorrecte pour l'email: ${email}`);
        throw new BadRequestException('Les informations fournies ne correspondent à aucun compte');
      }

      // Générer un jeton
      const resetToken = await this.resetTokenService.generateToken(user);

      // Envoyer l'email
      await this.mailService.sendPasswordResetEmail(user.email, resetToken.token, user.firstName);

      return { success: true, message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé' };
    } catch (error) {
      console.error('Erreur dans requestPasswordReset:', error);
      return { success: false, message: 'Une erreur est survenue lors du traitement de votre demande' };
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    try {
      const { token, newPassword, email } = resetPasswordDto;

      // Vérifier le token
      const resetToken = await this.resetTokenService.validateToken(token, email);
      if (!resetToken) {
        return { success: false, message: 'Lien de réinitialisation invalide ou expiré' };
      }

      // Vérifier si le token a déjà été utilisé
      if (resetToken.used) {
        return { success: false, message: 'Ce lien de réinitialisation a déjà été utilisé' };
      }

      // Mettre à jour le mot de passe de l'utilisateur
      await this.userService.updatePassword(email, newPassword);

      // Marquer le token comme utilisé
      await this.resetTokenService.markAsUsed(resetToken);
      console.log('Mot de passe réinitialisé avec succès pour l\'utilisateur:', resetToken.user.id);

      return { 
        success: true, 
        message: 'Mot de passe réinitialisé avec succès' 
      };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      return { 
        success: false, 
        message: 'Erreur lors de la réinitialisation du mot de passe' 
      };
    }
  }

  private async generateJwt(user: User): Promise<{ access_token: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }
 
}