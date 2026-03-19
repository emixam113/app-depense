import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn} from 'typeorm';
import {User} from '../../user/entity/user.entity';

@Entity()
export class ResetToken{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    code: string;

    @ManyToOne(() => User, (user) => user.resetTokens, { onDelete: 'CASCADE' })
    user: User;
    
    @Column({ default: false })
    used: boolean;
  
    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

}