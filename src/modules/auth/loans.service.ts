/* eslint-disable prettier/prettier */
import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from './loan.entity';
import { Item } from './item.entity';
import { User } from './user.entity';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private loansRepository: Repository<Loan>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async createLoan(userId: string, itemId: string, loanedAt: Date, dueAt: Date): Promise<Loan> {
    // Validar fechas
    if (dueAt <= loanedAt) {
      throw new BadRequestException('dueAt debe ser mayor que loanedAt');
    }

    // Validar que el usuario existe
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    // Validar que el item existe y está activo
    const item = await this.itemsRepository.findOne({ where: { id: itemId } });
    if (!item || !item.isActive) {
      throw new NotFoundException(`Item con id ${itemId} no encontrado o inactivo`);
    }

    // R2: Verificar que el item no tiene un préstamo activo
    const activeItemLoan = await this.loansRepository.findOne({
      where: { itemId, status: LoanStatus.ACTIVE },
    });
    if (activeItemLoan) {
      throw new ConflictException(`Item ${itemId} ya tiene un préstamo activo`);
    }

    // R3: Verificar que el usuario no tiene más de 3 préstamos activos
    const maxActiveLoans = this.configService.get<number>('maxActiveLoans') ?? 3;
    const userActiveLoansCount = await this.loansRepository.count({
      where: { userId, status: LoanStatus.ACTIVE },
    });
    if (userActiveLoansCount >= maxActiveLoans) {
      throw new ConflictException(`Usuario ya tiene ${maxActiveLoans} préstamos activos`);
    }

    // Crear el préstamo
    const loan = this.loansRepository.create({
      userId,
      itemId,
      loanedAt,
      dueAt,
      status: LoanStatus.ACTIVE,
      fineAmount: 0,
    });

    return this.loansRepository.save(loan);
  }

  async returnLoan(loanId: string): Promise<Loan> {
    const loan = await this.loansRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Préstamo con id ${loanId} no encontrado`);
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new ConflictException(`Préstamo ya ha sido devuelto o está en otro estado`);
    }

    const now = new Date();
    loan.returnedAt = now;

    // Calcular multa si está atrasado
    if (now > loan.dueAt) {
      loan.fineAmount = this.calculateFine(loan.dueAt);
      loan.status = LoanStatus.RETURNED;
    } else {
      loan.status = LoanStatus.RETURNED;
    }

    return this.loansRepository.save(loan);
  }

  calculateFine(dueAt: Date): number {
    const now = new Date();
    const dailyRate = this.configService.get<number>('dailyFineRate') ?? 0.5;

    // Si no está atrasado, no hay multa
    if (now <= dueAt) {
      return 0;
    }

    // Calcular días atrasados
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysOverdue = Math.ceil((now.getTime() - dueAt.getTime()) / msPerDay);

    // Calcular multa: días × tarifa diaria
    const fineAmount = daysOverdue * dailyRate;
    return Math.round(fineAmount * 100) / 100; // Redondear a 2 decimales
  }

  async getLoansByUserId(userId: string): Promise<Loan[]> {
    return this.loansRepository.find({
      where: { userId },
      relations: ['item', 'user'],
    });
  }

  async getLoanById(loanId: string): Promise<Loan> {
    const loan = await this.loansRepository.findOne({
      where: { id: loanId },
      relations: ['item', 'user'],
    });

    if (!loan) {
      throw new NotFoundException(`Préstamo con id ${loanId} no encontrado`);
    }

    return loan;
  }

  async updateLoanStatus(loanId: string, status: LoanStatus, fineAmount?: number): Promise<Loan> {
    const loan = await this.loansRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Préstamo con id ${loanId} no encontrado`);
    }

    loan.status = status;
    if (fineAmount !== undefined) {
      loan.fineAmount = fineAmount;
    }

    return this.loansRepository.save(loan);
  }

  async getActiveLoansCount(userId: string): Promise<number> {
    return this.loansRepository.count({
      where: { userId, status: LoanStatus.ACTIVE },
    });
  }

  async getAllLoans(): Promise<Loan[]> {
    return this.loansRepository.find({
      relations: ['item', 'user'],
    });
  }
}
