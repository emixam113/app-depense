import {Entity, PrimaryGeneratedColumn, Column, OneToMany, } from 'typeorm';
import {Expense} from '../../expense/entity/expense.entity';

@Entity('category')
export class Category{
  @PrimaryGeneratedColumn()
  id: number; 

  @Column()
  name: string;

  @Column({default: "#000000"})
  color: string;

  @OneToMany( () => Expense, (expense) => expense.category)
  expenses: Expense[];
}