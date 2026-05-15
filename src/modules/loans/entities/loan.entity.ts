import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Ajusta el path
import { Book } from '../../books/entities/book.entity'; // Ajusta el path

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Lado propietario de la relación con Usuario
  @ManyToOne(() => User, user => user.loans, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Lado propietario de la relación con Libro
  @ManyToOne(() => item, item => item.loans, { eager: true })
  @JoinColumn({ name: 'item_id' })
  book: Book;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  dueAt: Date;

  @Column({ type: 'date', nullable: true })
  returnAt: Date;

  @Column({ type: 'varchar', default: 'ACTIVE' }) // ACTIVE, RETURNED, OVERDUE, LOST
  status: string;
}