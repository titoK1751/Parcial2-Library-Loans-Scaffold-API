/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Item } from '../auth/item.entity';

export enum LoanStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  LOST = 'lost',
}

export enum LoanPriority {
  NORMAL = 'normal',
  URGENT = 'urgent',
}

@Entity('loans')
@Index(['itemId', 'status'])
@Index(['userId', 'status'])
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'userId' })
  userId!: string;

  @Column({ type: 'uuid', name: 'itemId' })
  itemId!: string;

  @Column({ type: 'timestamptz' })
  loanedAt!: Date;

  @Column({ type: 'timestamptz' })
  dueAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  returnedAt?: Date;

  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.ACTIVE,
  })
  status!: LoanStatus;

  @Column({
    type: 'enum',
    enum: LoanPriority,
    default: LoanPriority.NORMAL,
  })
  priority!: LoanPriority;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: '0.00' })
  fineAmount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Item, (item) => item.loans, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'itemId' })
  item!: Item;
}
