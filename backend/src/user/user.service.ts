import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  // ════════════════════════════════════════════════════════
  // CRÉER UN UTILISATEUR
  // ════════════════════════════════════════════════════════
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, birthDate, ...rest } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException(
        'Un utilisateur avec cet email existe déjà.',
      );
    }

    const hashedPassword = await argon2.hash(password);

    const newUser = this.userRepository.create({
      ...rest,
      email,
      password: hashedPassword,
      birthDate: new Date(birthDate),
    });

    return this.userRepository.save(newUser);
  }

  // ════════════════════════════════════════════════════════
  // RÉCUPÉRER TOUS LES UTILISATEURS
  // ════════════════════════════════════════════════════════
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // ════════════════════════════════════════════════════════
  // RÉCUPÉRER UN UTILISATEUR PAR ID
  // ════════════════════════════════════════════════════════
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    return user;
  }

  // ════════════════════════════════════════════════════════
  // RÉCUPÉRER UN UTILISATEUR PAR EMAIL
  // ════════════════════════════════════════════════════════
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  // ════════════════════════════════════════════════════════
  // METTRE À JOUR UN UTILISATEUR
  // ════════════════════════════════════════════════════════
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Vérifier si le nouvel email n'est pas déjà pris par quelqu'un d'autre
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existing) {
        throw new BadRequestException(
          'Cet email est déjà utilisé par un autre compte.',
        );
      }
    }

    // Rehash si modification du mot de passe
    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  // ════════════════════════════════════════════════════════
  // METTRE À JOUR LE MOT DE PASSE
  // ✅ CORRIGÉ — id en number, plus de parseInt risqué
  // ════════════════════════════════════════════════════════
  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  // ════════════════════════════════════════════════════════
  // ENREGISTRER LE TOKEN PUSH
  // ✅ AJOUT — utilisé par NotificationService backend
  // ════════════════════════════════════════════════════════
  async savePushToken(userId: number, pushToken: string): Promise<void> {
    const user = await this.findOne(userId);
    user.pushToken = pushToken;
    await this.userRepository.save(user);
  }

  // ════════════════════════════════════════════════════════
  // SUPPRIMER UN UTILISATEUR
  // ════════════════════════════════════════════════════════
  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
  }
}
