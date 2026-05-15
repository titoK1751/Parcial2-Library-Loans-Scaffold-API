/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Loan, LoanStatus, LoanPriority } from '../auth/loan.entity';
import { Item } from '../auth/item.entity';
import { User } from '../auth/user.entity';
import { CreateLoanDto, UpdateLoanDto, LoanResponseDto } from '../auth/dtos';
import { ConfigService } from '@nestjs/config';

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

  async create(createLoanDto: CreateLoanDto): Promise<LoanResponseDto> {
    // Validar que el usuario existe
    const user = await this.usersRepository.findOne({
      where: { id: createLoanDto.userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${createLoanDto.userId} no existe`);
    }

    // Validar que el item existe y está activo
    const item = await this.itemsRepository.findOne({
      where: { id: createLoanDto.itemId, isActive: true },
    });

    if (!item) {
      throw new NotFoundException(`Item con ID ${createLoanDto.itemId} no existe o está inactivo`);
    }

    // Verificar que el item no está prestado
    const activeLoan = await this.loansRepository.findOne({
      where: {
        itemId: createLoanDto.itemId,
        status: LoanStatus.ACTIVE,
      },
    });

    if (activeLoan) {
      throw new ConflictException(`Item ${item.code} ya está prestado`);
    }

    // Validar que dueAt > loanedAt
    const now = new Date();
    const dueAt = new Date(createLoanDto.dueAt);

    if (dueAt <= now) {
      throw new BadRequestException('La fecha de vencimiento debe ser en el futuro');
    }

    // Crear el préstamo
    const loan = this.loansRepository.create({
      userId: createLoanDto.userId,
      itemId: createLoanDto.itemId,
      loanedAt: now,
      dueAt,
      priority: createLoanDto.priority || LoanPriority.NORMAL,
    });

    const savedLoan = await this.loansRepository.save(loan);
    return this.mapToResponse(savedLoan);
  }

  async findAll(
    userId?: string,
    itemId?: string,
    status?: LoanStatus,
  ): Promise<LoanResponseDto[]> {
    const query = this.loansRepository.createQueryBuilder('loan');

    if (userId) {
      query.andWhere('loan.userId = :userId', { userId });
    }

    if (itemId) {
      query.andWhere('loan.itemId = :itemId', { itemId });
    }

    if (status) {
      query.andWhere('loan.status = :status', { status });
    }

    const loans = await query.orderBy('loan.createdAt', 'DESC').getMany();
    return loans.map((loan) => this.mapToResponse(loan));
  }

  async findOne(id: string): Promise<LoanResponseDto> {
    const loan = await this.loansRepository.findOne({
      where: { id },
    });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }

    return this.mapToResponse(loan);
  }

  async markAsReturned(id: string): Promise<LoanResponseDto> {
    const loan = await this.loansRepository.findOne({
      where: { id },
    });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException(
        `No se puede devolver un préstamo con estado ${loan.status}`,
      );
    }

    const now = new Date();
    loan.returnedAt = now;
    loan.status = LoanStatus.RETURNED;

    // Calcular multa por retraso
    if (now > loan.dueAt) {
      const finePerDay = this.configService.get<number>('loans.dailyFineRate') || 0.50;
      const daysLate = Math.ceil(
        (now.getTime() - loan.dueAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      loan.fineAmount = daysLate * finePerDay;
    }

    const updatedLoan = await this.loansRepository.save(loan);
    return this.mapToResponse(updatedLoan);
  }

  async markAsLost(id: string): Promise<LoanResponseDto> {
    const loan = await this.loansRepository.findOne({
      where: { id },
    });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }

    if (loan.status === LoanStatus.RETURNED || loan.status === LoanStatus.LOST) {
      throw new BadRequestException(
        `No se puede marcar como perdido un préstamo con estado ${loan.status}`,
      );
    }

    const replacementCost = this.configService.get<number>('loans.maxLoanDays') || 100;
    loan.status = LoanStatus.LOST;
    loan.fineAmount = replacementCost;
    loan.returnedAt = new Date();

    const updatedLoan = await this.loansRepository.save(loan);
    return this.mapToResponse(updatedLoan);
  }

  private mapToResponse(loan: Loan): LoanResponseDto {
    return {
      id: loan.id,
      userId: loan.userId,
      itemId: loan.itemId,
      loanedAt: loan.loanedAt,
      dueAt: loan.dueAt,
      returnedAt: loan.returnedAt || undefined,
      status: loan.status,
      priority: loan.priority,
      fineAmount: loan.fineAmount,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    };
  }
}
