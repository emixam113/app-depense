import { Controller, Post, Body, Get, Query, BadRequestException } from '@nestjs/common';
import { MailService } from './mail.service';
import { UserService } from '../user/user.service';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
  ) {}

  @Post('test')
  async sendTestEmail(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.mailService.sendTestEmail(email);
  }

  @Post('reset-password')
  async sendResetPassword(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    // Chercher l'utilisateur par email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate a reset token (you might want to use a proper token generation logic)
    const resetToken = 'generated-token-here'; // Replace with your token generation logic
    
    // Send the password reset email
    await this.mailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);

    return {
      message: 'Email de réinitialisation envoyé',
      tokenSent: resetToken, 
    };
  }
}
