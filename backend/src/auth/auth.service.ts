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

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName']
    });

    if (!user) {
      throw new BadRequestException('Identifiants invalides');
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new BadRequestException('Identifiants invalides');
    }

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

      if (!birthdate || typeof birthdate !== 'string' || birthdate.trim() === '') {
        throw new BadRequestException('La date de naissance est requise');
      }

      // --- ✅ Normalisation de la date ---
      let formattedDate: string;
      if (/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
        // Déjà au format YYYY-MM-DD
        formattedDate = birthdate;
      } else {
        // Convertir JJ/MM/AAAA ou JJ-MM-AAAA en YYYY-MM-DD
        const separator = birthdate.includes('/') ? '/' : '-';
        const [day, month, year] = birthdate.split(separator).map(Number);

        if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
          throw new BadRequestException('Format de date invalide. Utilisez JJ/MM/AAAA ou YYYY-MM-DD');
        }

        formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }

      console.log('Date normalisée (YYYY-MM-DD):', formattedDate);

      // Vérifier si l’utilisateur existe
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'firstName', 'birthDate']
      });

      if (!user) {
        throw new NotFoundException('Aucun compte trouvé avec cet email');
      }

      // Vérifier correspondance date
      const dbDate = new Date(user.birthDate).toISOString().split('T')[0];
      console.log('Date en base:', dbDate);

      if (formattedDate !== dbDate) {
        throw new BadRequestException('Les informations fournies ne correspondent à aucun compte');
      }

      // Générer un token
      const resetToken = await this.resetTokenService.generateToken(user);

      // Envoyer email
      await this.mailService.sendPasswordResetEmail(user.email, resetToken.token, user.firstName);

      return { success: true, message: 'Un email de réinitialisation a été envoyé' };
    } catch (error) {
      console.error('Erreur dans requestPasswordReset:', error);
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    try {
      const { token, newPassword, email } = resetPasswordDto;

      const resetToken = await this.resetTokenService.validateToken(token, email);
      if (!resetToken) {
        return { success: false, message: 'Lien invalide ou expiré' };
      }

      if (resetToken.used) {
        return { success: false, message: 'Ce lien a déjà été utilisé' };
      }

      await this.userService.updatePassword(email, newPassword);
      await this.resetTokenService.markAsUsed(resetToken);

      return { success: true, message: 'Mot de passe réinitialisé avec succès' };
    } catch (error) {
      console.error('Erreur lors de resetPassword:', error);
      return { success: false, message: 'Erreur lors de la réinitialisation' };
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
