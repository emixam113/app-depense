import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //Créer un nouvel utilisateur
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, birthDate, ...rest } = createUserDto;

    // Vérifie si l'email existe déjà
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà.');
    }

    //Hash du mot de passe
    const hashedPassword = await argon2.hash(password);

    // Création de l'utilisateur
    const newUser = this.userRepository.create({
      ...rest,
      email,
      password: hashedPassword,
      birthDate: new Date(birthDate),
    });

    return this.userRepository.save(newUser);
  }

  //Récupérer tous les utilisateurs
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  //Récupérer un utilisateur par ID
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    return user;
  }

  // 🔹 Récupérer un utilisateur par email
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  // 🔹 Mettre à jour un utilisateur
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Si on modifie le mot de passe → on le rehash
    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  // 🔹 Mettre à jour uniquement le mot de passe
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: parseInt(userId) } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  // 🔹 Supprimer un utilisateur
  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
  }
}
