import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Method } from './entity/method.entity';
import { User } from '../user/entity/user.entity';

@Injectable()
export class MethodeService {
  constructor(
    @InjectRepository(Method)
    private methodRepository: Repository<Method>,
  ) {}

  private calculate503020(income: number) {
    return {
      needBudget: income * 0.5,
      wantBudget: income * 0.3,
      savingBudget: income * 0.2,
    };
  }

  async create(data: { income: number }, user: User) {
    const calculation = this.calculate503020(data.income || 0);

    const newMethod = this.methodRepository.create({
      income: data.income,
      ...calculation,
      user: user, // On lie directement l'objet user complet
    });

    return await this.methodRepository.save(newMethod);
  }

  async findAllForUser(user: User) {
    return await this.methodRepository.find({
      where: { user: { id: user.id } },
    });
  }

  async findOne(id: number, user: User) {
    return await this.methodRepository.findOne({
      where: { id, user: { id: user.id } },
    });
  }

  async update(id: number, data: any, user: User) {
    await this.methodRepository.update({ id, user: { id: user.id } }, data);
    return this.findOne(id, user);
  }

  async remove(id: number, user: User) {
    return await this.methodRepository.delete({ id, user: { id: user.id } });
  }
}
