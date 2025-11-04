import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../user/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Récupère le token JWT dans le header Authorization
      ignoreExpiration: false, // On vérifie la date d’expiration
      secretOrKey: configService.get<string>('JWT_SECRET'), // Récupère la clé secrète du .env
    });
  }

  // ✅ Méthode appelée automatiquement si le token est valide
  async validate(payload: any): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      return null;
    }

    // Ce qui est retourné ici sera injecté dans `req.user`
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
