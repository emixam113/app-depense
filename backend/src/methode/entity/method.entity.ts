import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity()
export class Method {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  income: number

  @Column('float')
  needBudget: number

  @Column('float')
  wantBudget: number;

  @Column('float')
  savingBudget: number;

  @ManyToOne(() => User, (user) => user.methods)
  user: User;
}