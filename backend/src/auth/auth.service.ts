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

  // ✅ MÉTHODE APPELÉE PAR LE CONTROLLER POUR /profile
  async getProfile(userId: number) {
    return this.userService.getProfileWithBalance(userId);
  }

  async signup(signupDto: any) {
    const { email, password, confirmPassword, firstName, lastName, birthDate } =
      signupDto;
    if (password !== confirmPassword)
      throw new BadRequestException('Mots de passe différents');

    const newUser = await this.userService.create({
      email,
      password, // Le UserService va le hasher
      firstName,
      lastName,
      birthDate: birthDate || new Date().toISOString(),
    });

    const payload = { sub: newUser.id, email: newUser.email };
    return {
      message: 'Utilisateur créé',
      access_token: this.jwtService.sign(payload),
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isPremium: newUser.isPremium,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new BadRequestException('Mot de passe incorrect');

    const payload = { sub: user.id, email: user.email };
    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Connexion réussie',
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const resetToken = await this.resetTokenService.createToken(user);
    await this.mailService.sendPasswordResetEmail(
      user.email,
      resetToken.code,
      user.firstName,
    );
    return { message: 'Code envoyé', success: true };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const resetToken = await this.resetTokenService.findValidToken(user, code);
    if (!resetToken) throw new BadRequestException('Code invalide ou expiré');

    const hashedPassword = await argon2.hash(newPassword);
    await this.userService.updatePassword(user.id.toString(), hashedPassword);
    await this.resetTokenService.markAsUsed(resetToken);
    return { message: 'Mot de passe réinitialisé', success: true };
  }
}
