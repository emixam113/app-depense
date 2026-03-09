import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import * as argon2 from 'argon2';
import { ResetTokenService } from './reset-token.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly resetTokenService: ResetTokenService,
    private readonly jwtService: JwtService,
  ) {}

  // ════════════════════════════════════════════════════════
  // INSCRIPTION
  // ════════════════════════════════════════════════════════
  async signup(signupDto: any) {
    const { email, password, confirmPassword, firstName, lastName, birthDate } =
      signupDto;

    if (password !== confirmPassword)
      throw new BadRequestException('Les mots de passe ne correspondent pas.');

    // ✅ Le hash est fait dans UserService.create() — pas besoin de le refaire ici
    const newUser = await this.userService.create({
      email,
      password, // ← mot de passe en clair, UserService s'occupe du hash
      firstName,
      lastName,
      birthDate: birthDate || new Date().toISOString(),
    });

    const payload = { sub: newUser.id, email: newUser.email };
    const access_token = this.jwtService.sign(payload);

    return {
      message: 'Utilisateur créé avec succès.',
      access_token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        birthDate: newUser.birthDate,
      },
    };
  }

  // ════════════════════════════════════════════════════════
  // CONNEXION
  // ════════════════════════════════════════════════════════
  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur non trouvé.');

    if (!user.password) throw new BadRequestException('Mot de passe invalide.');

    const valid = await argon2.verify(user.password, password).catch(() => {
      throw new BadRequestException('Erreur de vérification du mot de passe.');
    });

    if (!valid) throw new BadRequestException('Mot de passe incorrect.');

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return { message: 'Connexion réussie.', access_token, user };
  }

  // ════════════════════════════════════════════════════════
  // MOT DE PASSE OUBLIÉ — envoi du code par email
  // ════════════════════════════════════════════════════════
  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);

    // Sécurité : ne pas révéler si l'email existe ou non
    if (!user) {
      return {
        message: 'Si ce compte existe, un email a été envoyé.',
        success: true,
      };
    }

    const resetToken = await this.resetTokenService.createToken(user);
    await this.mailService.sendPasswordResetEmail(
      user.email,
      resetToken.code,
      user.firstName,
    );

    return {
      message: 'Si ce compte existe, un email a été envoyé.',
      success: true,
    };
  }

  // ════════════════════════════════════════════════════════
  // RÉINITIALISATION DU MOT DE PASSE
  // ✅ CORRIGÉ — user.id directement (number), plus de toString()
  // ════════════════════════════════════════════════════════
  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur non trouvé.');

    const resetToken = await this.resetTokenService.findValidToken(user, code);
    if (!resetToken) throw new BadRequestException('Code invalide ou expiré.');

    const hashedPassword = await argon2.hash(newPassword);
    await this.userService.updatePassword(user.id, hashedPassword); // ✅ number direct

    await this.resetTokenService.markAsUsed(resetToken);

    return { message: 'Mot de passe réinitialisé avec succès.', success: true };
  }
}
