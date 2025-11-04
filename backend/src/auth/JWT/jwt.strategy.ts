import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJWT, Strategy} from 'passport-jwt';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class JwtSrategy extends PassportStrategy(Strategy){
  constructor(private configService) {
    super({
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken();
      ingoreExpiration: false;
      setOrKey: config.service.get('JWT_SECRET') || 'secret',
    });
  }
  async Validate(payload: any){
    return(id: payload.sub, email: payload.email);
  }
}