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

  // 🧾 Connexion
  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (!user.password)
      throw new BadRequestException('Utilisateur invalide : mot de passe manquant.');

    const valid = await argon2.verify(user.password, password).catch(() => {
      throw new BadRequestException('Erreur de vérification du mot de passe');
    });

    if (!valid) throw new BadRequestException('Mot de passe incorrect');

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return { message: 'Connexion réussie', access_token, user };
  }

  // 🆕 Inscription
  async signup(signupDto: any) {
    const { email, password, confirmPassword, firstName, lastName, birthDate } = signupDto;

    if (password !== confirmPassword)
      throw new BadRequestException('Les mots de passe ne correspondent pas');

    const hashedPassword = await argon2.hash(password);

    const newUser = await this.userService.create({
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      birthDate: birthDate || new Date().toISOString(),
    });



    return { message: 'Utilisateur créé avec succès', newUser };
  }

  // ✉️ Demande de réinitialisation du mot de passe
  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    // ✅ Correction ici
    const resetToken = await this.resetTokenService.createToken(user);

    await this.mailService.sendPasswordResetEmail(
      user.email,
      resetToken.code,
      user.firstName,
    );

    return {
      message: 'Code de réinitialisation envoyé à votre adresse email.',
      success: true,
    };
  }

  // 🔑 Validation du code et réinitialisation du mot de passe
  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const resetToken = await this.resetTokenService.findValidToken(user, code);
    if (!resetToken)
      throw new BadRequestException('Code invalide ou expiré.');

    const hashedPassword = await argon2.hash(newPassword);
    await this.userService.updatePassword(user.id.toString(), hashedPassword);

    await this.resetTokenService.markAsUsed(resetToken);

    return {
      message: 'Mot de passe réinitialisé avec succès.',
      success: true,
    };
  }
}
