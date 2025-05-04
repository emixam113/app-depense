import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from 'typeorm';
import {User} from '../../user/entity/user.entity'
import {Category} from '../../category/entity/category.entity'

@Entity("expenses")
export class Expense {
  @PrimaryGeneratedColumn()
  id: number; 

  @Column()
  label: string;

  @Column('decimal', {precision: 10, scale: 2})
  amount: number;

  @Column()
  date: Date;

  @ManyToOne(() => User, (user) => user.expense, {onDelete: 'SET NULL'})
  user: User;

  @ManyToOne(() => Category, (category) => category.expenses, {eager: true})
  category: Category;
}