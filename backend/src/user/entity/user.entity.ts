import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {Expense} from '../../expense/entity/expense.entity'
import {Method} from '../../methode/entity/method.entity'


@Entity()
export class User{
  [x: string]: any;
@PrimaryGeneratedColumn()
id: number; 

@Column()
lastName: string; 

@Column()
firstName: string;

@Column({type: 'date'})
birthDate: Date;

@Column({unique: true})
email: string; 

@Column()
password: string; 

@OneToMany(() => Expense, (expense) => expense.user)
expense: Expense[];

@OneToMany(() => Method, (method) => method.user)
method: Method[];
}