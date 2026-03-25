import {
  Controller,
  Get,
  Body,
  Delete,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { JwtAuthGuard } from '../auth/JWT/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard) // ✅ Toutes les routes protégées
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Récupère le profil de l'utilisateur connecté
  @Get('me')
  async getProfile(@Req() req: Request): Promise<User> {
    // ✅ Données fraîches depuis la base
    return this.userService.findOne(req.user['id']);
  }

  // Met à jour le profil de l'utilisateur connecté
  @Patch('me')
  async update(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    // ✅ L'utilisateur ne peut modifier que son propre profil
    return this.userService.update(req.user['id'], updateUserDto);
  }

  // Supprime le compte de l'utilisateur connecté
  @Delete('me')
  async remove(@Req() req: Request): Promise<void> {
    // ✅ L'utilisateur ne peut supprimer que son propre compte
    return this.userService.remove(req.user['id']);
  }
}
