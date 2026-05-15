/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '@modules/auth/user.entity';
import { Item } from '@modules/auth/item.entity';
import { Loan, LoanStatus, LoanPriority } from '@modules/auth/loan.entity';
import { CreateLoanDto, UpdateLoanDto, LoanResponseDto } from '@modules/auth/dtos';
import { ItemsService } from './items.service';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private loansRepository: Repository<Loan>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private itemsService: ItemsService,
  ) {}

  async create(createLoanDto: CreateLoanDto): Promise<LoanResponseDto> {
    const { userId, itemId, loanedAt, dueAt, priority } = createLoanDto;

    // Validaciones
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado o inactivo`);
    }

    const item = await this.itemsRepository.findOne({ where: { id: itemId } });
    if (!item || !item.isActive) {
      throw new NotFoundException(`Artículo con ID ${itemId} no encontrado o inactivo`);
    }

    // Verificar que el item no tenga un préstamo activo
    const activeLoan = await this.loansRepository.findOne({
      where: { itemId, status: LoanStatus.ACTIVE },
    });
    if (activeLoan) {
      throw new ConflictException(
        `El artículo ${itemId} ya tiene un préstamo activo`,
      );
    }

    const loanedDate = new Date(loanedAt);
    const dueDate = new Date(dueAt);

    // Validar que dueAt > loanedAt
    if (dueDate <= loanedDate) {
      throw new BadRequestException(
        'La fecha de vencimiento debe ser posterior a la fecha del préstamo',
      );
    }

    const loan = this.loansRepository.create({
      userId,
      itemId,
      loanedAt: loanedDate,
      dueAt: dueDate,
      status: LoanStatus.ACTIVE,
      priority: priority || LoanPriority.NORMAL,
      fineAmount: 0,
    });

    const savedLoan = await this.loansRepository.save(loan);
    return this.toResponseDto(savedLoan);
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
    return loans.map((loan) => this.toResponseDto(loan));
  }

  async findById(id: string): Promise<LoanResponseDto> {
    const loan = await this.loansRepository.findOne({ where: { id } });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }

    return this.toResponseDto(loan);
  }

  async markReturned(id: string): Promise<LoanResponseDto> {
    const loan = await this.loansRepository.findOne({ where: { id } });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException(
        `No se puede devolver un préstamo con estado ${loan.status}`,
      );
    }

    const returnedAt = new Date();
    const dueDate = new Date(loan.dueAt);
    
    // Calcular multa: 0.05 × 24 horas * (returnedAt - dueAt) si retardo > 0
    let fineAmount = 0;
    if (returnedAt > dueDate) {
      const millisecondsLate = returnedAt.getTime() - dueDate.getTime();
      const hoursLate = millisecondsLate / (1000 * 60 * 60);
      const daysLate = hoursLate / 24;
      fineAmount = 0.05 * daysLate; // 0.05 por día de retraso
    }

    loan.returnedAt = returnedAt;
    loan.status = LoanStatus.RETURNED;
    loan.fineAmount = Number(fineAmount.toFixed(2));

    const updatedLoan = await this.loansRepository.save(loan);
    return this.toResponseDto(updatedLoan);
  }

  async markLost(id: string): Promise<LoanResponseDto> {
    const loan = await this.loansRepository.findOne({ where: { id } });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException(
        `No se puede marcar como perdido un préstamo con estado ${loan.status}`,
      );
    }

    loan.status = LoanStatus.LOST;
    loan.returnedAt = new Date();

    const updatedLoan = await this.loansRepository.save(loan);
    return this.toResponseDto(updatedLoan);
  }

  private toResponseDto(loan: Loan): LoanResponseDto {
    return {
      id: loan.id,
      userId: loan.userId,
      itemId: loan.itemId,
      loanedAt: loan.loanedAt,
      dueAt: loan.dueAt,
      returnedAt: loan.returnedAt,
      status: loan.status,
      priority: loan.priority,
      fineAmount: loan.fineAmount,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    };
  }
}
