import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm'; // ✅ ajout de MoreThan
import { ResetToken } from './entity/reset-token.entity';
import { User } from '../user/entity/user.entity';

@Injectable()
export class ResetTokenService {
  constructor(
    @InjectRepository(ResetToken)
    private readonly resetTokenRepository: Repository<ResetToken>,
  ) {}

  // 🔹 Crée un nouveau token de réinitialisation
  async createToken(user: User): Promise<ResetToken> {
    const code = Math.floor(100 + Math.random() * 900).toString(); // ex: 403

    // Supprimer les anciens tokens non utilisés pour cet utilisateur
    await this.resetTokenRepository.delete({ user: { id: user.id }, used: false });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // expire dans 15 minutes

    const resetToken = this.resetTokenRepository.create({
      user,
      code,
      used: false,
      expiresAt,
    });

    return this.resetTokenRepository.save(resetToken);
  }

  // 🔹 Trouve un token valide
  async findValidToken(user: User, code: string): Promise<ResetToken | null> {
    const now = new Date();

    const token = await this.resetTokenRepository.findOne({
      where: {
        user: { id: user.id },
        code,
        used: false,
        expiresAt: MoreThan(now), // ✅ fonctionne avec l'import
      },
      relations: ['user'],
    });

    return token || null;
  }

  // 🔹 Marque un token comme utilisé
  async markAsUsed(token: ResetToken): Promise<void> {
    token.used = true;
    await this.resetTokenRepository.save(token);
  }

  // 🔹 Nettoyage automatique des anciens tokens expirés (optionnel)
  async cleanExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.resetTokenRepository.delete({ expiresAt: LessThan(now) });
  }
}
