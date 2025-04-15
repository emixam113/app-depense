import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from 'typeorm'; 
import {Expense} from '../../expense/entity/expense.entity';

@Entity('category')
export class Category{
  @PrimaryGeneratedColumn()
  id: number; 

  @Column()
  name: string; 

  @OneToMany( () => Expense, (expense) => expense.category)
  expenses: Expense[];
}