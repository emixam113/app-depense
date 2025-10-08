import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2'; // ✅ Import nécessaire pour le hachage
import { User } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Trouver un utilisateur par email
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Créer un utilisateur
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  // Récupérer tous les utilisateurs
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Récupérer un utilisateur par ID
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  // Mettre à jour un utilisateur
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const updated = Object.assign(user, updateUserDto);
    return this.userRepository.save(updated);
  }

  // Supprimer un utilisateur
  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  // ✅ Mettre à jour le mot de passe (avec hash Argon2)
  async updatePassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'email ${email} non trouvé`);
    }

    // 🔒 Hachage sécurisé du nouveau mot de passe
    const hashedPassword = await argon2.hash(newPassword);

    user.password = hashedPassword;
    await this.userRepository.save(user);

    console.log(`Mot de passe mis à jour pour ${email}`);
  }
}
