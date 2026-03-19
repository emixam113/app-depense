import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Category } from '../../category/entity/category.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  type: 'expense' | 'income';

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne(() => User, (user) => user.expenses, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'user_id', nullable: true })
  userId: number | null;

  @ManyToOne(() => Category, (category) => category.expenses, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeAmount() {
    this.type = this.type?.toLowerCase() as 'expense' | 'income'; // ✅ sécurité

    if (this.type === 'expense') {
      this.amount = -Math.abs(Number(this.amount)); // Dépense → négatif
    } else if (this.type === 'income') {
      this.amount = Math.abs(Number(this.amount)); // Revenu → positif
    }
  }
}
