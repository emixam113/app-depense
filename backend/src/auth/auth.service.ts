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

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || !(await argon2.verify(user.password, password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async requestPasswordReset(email: string, birthdate: string) {
    try {
      console.log('Données reçues - email:', email, 'birthdate:', birthdate, 'type:', typeof birthdate);
      
      // Vérifier que birthdate est défini et n'est pas vide
      if (!birthdate || typeof birthdate !== 'string' || birthdate.trim() === '') {
        console.log('Date de naissance manquante ou invalide');
        return { message: 'La date de naissance est requise' };
      }
      
      // Valider le format de la date
      // Accepter à la fois les séparateurs '/' et '-'
      const separator = birthdate.includes('/') ? '/' : '-';
      const [day, month, year] = birthdate.split(separator).map(Number);
      
      // Vérifier que la date est valide
      if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
        console.log(`Format de date invalide (attendu JJ-MM-AAAA ou JJ/MM/AAAA): ${birthdate}`);
        return { message: 'Format de date invalide. Utilisez le format JJ-MM-AAAA ou JJ/MM/AAAA' };
      }
      
      // Créer une date en UTC (mois est 0-indexé, donc on soustrait 1)
      const birthDateObj = new Date(Date.UTC(year, month - 1, day));
      
      // Vérifier que la date est valide
      if (isNaN(birthDateObj.getTime()) || 
          birthDateObj.getUTCDate() !== day || 
          birthDateObj.getUTCMonth() !== month - 1 || 
          birthDateObj.getUTCFullYear() !== year) {
        console.log(`Date invalide: ${day}/${month}/${year}`);
        return { message: 'Date de naissance invalide' };
      }
      
      // Formater la date en YYYY-MM-DD pour la comparaison
      const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      console.log('Date formatée pour la comparaison (YYYY-MM-DD):', formattedDate);
      
      // Vérifier que l'utilisateur existe d'abord
      const user = await this.userRepository.findOne({ 
        where: { email },
        select: ['id', 'email', 'firstName', 'birthDate']
      });
      
      if (user) {
        // Formater la date de la base de données au même format
        const dbDate = new Date(user.birthDate);
        const dbFormattedDate = [
          dbDate.getUTCFullYear(),
          String(dbDate.getUTCMonth() + 1).padStart(2, '0'),
          String(dbDate.getUTCDate()).padStart(2, '0')
        ].join('-');
        
        console.log('Date de naissance en base pour cet utilisateur:', dbFormattedDate);
        
        if (formattedDate !== dbFormattedDate) {
          console.log(`Les dates ne correspondent pas: ${formattedDate} (saisie) vs ${dbFormattedDate} (base)`);
          return { message: 'Si un compte avec cet email existe, un code de réinitialisation a été envoyé' };
        }
      }
      
      console.log('Utilisateur trouvé:', !!user);
      
      // Ne pas révéler si l'utilisateur n'existe pas ou si la date de naissance ne correspond pas
      if (!user) {
        console.log(`Tentative de réinitialisation pour un email inconnu ou date de naissance incorrecte: ${email}`);
        return { message: 'Si un compte avec cet email existe, un code de réinitialisation a été envoyé' };
      }

      // Générer un jeton
      const resetToken = await this.resetTokenService.generateToken(user);

      // Envoyer l'email
      await this.mailService.sendPasswordResetEmail(user.email, resetToken.token, user.firstName);

      return { message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé' };
    } catch (error) {
      console.error('Erreur dans requestPasswordReset:', error);
      return { message: 'Une erreur est survenue lors du traitement de votre demande' };
    }
  }

  async resetPassword(token: string, newPassword: string, email: string) {
    console.log('resetPassword called with email:', email);
    
    // Valider le jeton avec l'email
    const resetToken = await this.resetTokenService.validateToken(token, email);
    if (!resetToken) {
      console.error('Invalid or expired token for email:', email);
      throw new BadRequestException('Lien de réinitialisation invalide, expiré ou ne correspondant pas à cet email');
    }

    try {
      // Mettre à jour le mot de passe en utilisant le service utilisateur
      console.log('Updating password for user:', resetToken.user.id);
      const hashedPassword = await argon2.hash(newPassword);
      await this.userService.updatePassword(email, hashedPassword);

      // Marquer le jeton comme utilisé
      await this.resetTokenService.markAsUsed(resetToken);
      console.log('Password updated successfully for user:', resetToken.user.id);

      return { message: 'Mot de passe réinitialisé avec succès' };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      throw new BadRequestException('Erreur lors de la réinitialisation du mot de passe');
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