import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Category } from '../../category/entity/category.entity';

@Entity('expense')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', default: 'expense' })
  type: 'expense' | 'income';

  @Column()
  date: Date;

  @Column({ nullable: true })
  userId: number;

  @JoinColumn({ name: 'userId' })
  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'SET NULL' })
  user: User;

  @Column({ nullable: true })
  categoryId: number;

  @JoinColumn({ name: 'categoryId' })
  @ManyToOne(() => Category, (category) => category.expenses, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  category: Category | null;
}
