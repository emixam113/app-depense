import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResetToken } from './entity/reset-token.entity';
import { User } from '../user/entity/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class ResetTokenService {
  constructor(
    @InjectRepository(ResetToken)
    private readonly resetTokenRepo: Repository<ResetToken>,
  ) {}

  async generateToken(user: User): Promise<ResetToken> {
    // Supprimer les anciens jetons
    await this.resetTokenRepo.delete({ user: { id: user.id } });

    // Créer un code à 3 chiffres
    const token = Math.floor(100 + Math.random() * 900).toString(); // Génère un nombre entre 100 et 999
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expire dans 15 minutes

    const resetToken = this.resetTokenRepo.create({
      token,
      user,
      expiresAt,
      used: false,
    });

    return this.resetTokenRepo.save(resetToken);
  }

  async validateToken(token: string, email?: string): Promise<ResetToken | null> {
    const where: any = { token };
    if (email) {
      where.user = { email };
    }
    
    const resetToken = await this.resetTokenRepo.findOne({
      where,
      relations: ['user'],
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return null;
    }

    return resetToken;
  }

  async markAsUsed(token: ResetToken): Promise<void> {
    token.used = true;
    await this.resetTokenRepo.save(token);
  }
}
