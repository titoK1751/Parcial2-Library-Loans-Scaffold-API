/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Loan } from '../auth/loan.entity';

export enum ItemType {
  BOOK = 'book',
  MAGAZINE = 'magazine',
  EQUIPMENT = 'equipment',
}

@Entity('items')
@Index(['code'], { unique: true })
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({
    type: 'enum',
    enum: ItemType,
  })
  type!: ItemType;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Loan, (loan) => loan.item)
  loans!: Loan[];
}
