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

  // ✅ RÉCUPÉRATION DU PROFIL AVEC CALCUL DU SOLDE
  async getProfileWithBalance(id: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['expenses'], // Charge les dépenses liées
    });

    if (!user) throw new NotFoundException(`Utilisateur non trouvé`);

    // Comme ton entité Expense gère déjà les signes (+/-), on fait juste la somme
    const totalBalance =
      user.expenses?.reduce(
        (acc, expense) => acc + Number(expense.amount),
        0,
      ) || 0;

    // 🛡️ Sécurité : On retire le password avant de renvoyer
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      totalBalance,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, birthDate, ...rest } = createUserDto;
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) throw new BadRequestException('Email déjà utilisé.');

    const hashedPassword = await argon2.hash(password);
    const newUser = this.userRepository.create({
      ...rest,
      email,
      password: hashedPassword,
      birthDate: new Date(birthDate),
    });
    return this.userRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur non trouvé`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password);
    }
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: parseInt(userId) });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Non trouvé`);
  }

  async updatePremiumStatus(id: number, isPremium: boolean): Promise<void> {
    const user = await this.findOne(id);
    user.isPremium = isPremium;
    await this.userRepository.save(user);
  }
}
