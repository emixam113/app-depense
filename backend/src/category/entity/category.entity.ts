import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expense } from '../../expense/entity/expense.entity';
import { User } from '../../user/entity/user.entity';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ default: '#000000' })
  color: string;

  @Column({ name: 'isDefault', default: false })
  isDefault: boolean;

  @ManyToOne(() => User, (user) => user.categories, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  user: User | null;

  @OneToMany(() => Expense, (expense) => expense.category, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  expenses: Expense[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
