/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LoansService } from './loans.service';
import { Loan, LoanStatus } from './loan.entity';
import { Item, ItemType } from './item.entity';
import { User, UserRole } from './user.entity';

describe('LoansService', () => {
  let service: LoansService;
  let loansRepository: jest.Mocked<Repository<Loan>>;
  let itemsRepository: jest.Mocked<Repository<Item>>;
  let usersRepository: jest.Mocked<Repository<User>>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Mock repositories
    loansRepository = {
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as any;

    itemsRepository = {
      findOne: jest.fn(),
    } as any;

    usersRepository = {
      findOne: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        {
          provide: getRepositoryToken(Loan),
          useValue: loansRepository,
        },
        {
          provide: getRepositoryToken(Item),
          useValue: itemsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
  });

  describe('createLoan', () => {
    it('Crea préstamo exitoso cuando item disponible, usuario bajo el límite y fechas válidas', async () => {
      // Arrange
      const userId = 'user-123';
      const itemId = 'item-456';
      const now = new Date();
      const loanedAt = new Date(now.getTime());
      const dueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 días después

      const mockUser: User = {
        id: userId,
        email: 'user@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: UserRole.MEMBER,
        isActive: true,
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshTokens: [],
        loans: [],
      };

      const mockItem: Item = {
        id: itemId,
        code: 'BOOK-001',
        title: 'Test Book',
        type: ItemType.BOOK,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        loans: [],
      };

      const mockLoan: Loan = {
        id: 'loan-123',
        userId,
        itemId,
        loanedAt,
        dueAt,
        returnedAt: undefined,
        status: LoanStatus.ACTIVE,
        fineAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
        item: mockItem,
      };

      usersRepository.findOne.mockResolvedValue(mockUser);
      itemsRepository.findOne.mockResolvedValue(mockItem);
      loansRepository.findOne.mockResolvedValue(null);
      loansRepository.count.mockResolvedValue(0);
      loansRepository.create.mockReturnValue(mockLoan);
      loansRepository.save.mockResolvedValue(mockLoan);
      configService.get.mockReturnValue(3);

      // Act
      const result = await service.createLoan(userId, itemId, loanedAt, dueAt);

      // Assert
      expect(result).toEqual(mockLoan);
      expect(result.status).toBe(LoanStatus.ACTIVE);
      expect(result.fineAmount).toBe(0);
      expect(loansRepository.save).toHaveBeenCalledWith(mockLoan);
    });

    it('Lanza ConflictException si el item ya tiene un préstamo activo (R2)', async () => {
      // Arrange
      const userId = 'user-123';
      const itemId = 'item-456';
      const now = new Date();
      const loanedAt = new Date(now.getTime());
      const dueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const mockUser: User = {
        id: userId,
        email: 'user@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: UserRole.MEMBER,
        isActive: true,
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshTokens: [],
        loans: [],
      };

      const mockItem: Item = {
        id: itemId,
        code: 'BOOK-001',
        title: 'Test Book',
        type: ItemType.BOOK,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        loans: [],
      };

      const existingActiveLoan: Loan = {
        id: 'loan-existing',
        userId: 'other-user',
        itemId,
        loanedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        returnedAt: undefined,
        status: LoanStatus.ACTIVE,
        fineAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
        item: mockItem,
      };

      usersRepository.findOne.mockResolvedValue(mockUser);
      itemsRepository.findOne.mockResolvedValue(mockItem);
      loansRepository.findOne.mockResolvedValue(existingActiveLoan);
      configService.get.mockReturnValue(3);

      // Act & Assert
      await expect(
        service.createLoan(userId, itemId, loanedAt, dueAt)
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createLoan(userId, itemId, loanedAt, dueAt)
      ).rejects.toThrow('ya tiene un préstamo activo');
    });

    it('Lanza ConflictException si el usuario ya tiene 3 préstamos activos (R3)', async () => {
      // Arrange
      const userId = 'user-123';
      const itemId = 'item-456';
      const now = new Date();
      const loanedAt = new Date(now.getTime());
      const dueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const mockUser: User = {
        id: userId,
        email: 'user@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: UserRole.MEMBER,
        isActive: true,
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshTokens: [],
        loans: [],
      };

      const mockItem: Item = {
        id: itemId,
        code: 'BOOK-001',
        title: 'Test Book',
        type: ItemType.BOOK,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        loans: [],
      };

      usersRepository.findOne.mockResolvedValue(mockUser);
      itemsRepository.findOne.mockResolvedValue(mockItem);
      loansRepository.findOne.mockResolvedValue(null); // No hay préstamo activo del item
      loansRepository.count.mockResolvedValue(3); // Usuario ya tiene 3 préstamos activos
      configService.get.mockReturnValue(3);

      // Act & Assert
      await expect(
        service.createLoan(userId, itemId, loanedAt, dueAt)
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createLoan(userId, itemId, loanedAt, dueAt)
      ).rejects.toThrow('ya tiene 3 préstamos activos');
    });

    it('Calcula multa correctamente: dado un préstamo con dueAt = hace 5 días, al devolver hoy debe calcular fineAmount = 5 × 0.50 = 2.50 (R4)', () => {
      // Arrange
      const now = new Date();
      const dueAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // Hace 5 días

      configService.get.mockReturnValue(0.5); // Tarifa diaria de 0.50

      // Act
      const fineAmount = service.calculateFine(dueAt);

      // Assert
      expect(fineAmount).toBe(2.5); // 5 días × 0.50 = 2.50
    });
  });

  describe('calculateFine', () => {
    it('Debe retornar 0 si la fecha de devolución no está vencida', () => {
      // Arrange
      const now = new Date();
      const dueAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // En 5 días

      configService.get.mockReturnValue(0.5);

      // Act
      const fineAmount = service.calculateFine(dueAt);

      // Assert
      expect(fineAmount).toBe(0);
    });

    it('Debe calcular correctamente para 1 día atrasado', () => {
      // Arrange
      const now = new Date();
      const dueAt = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 - 1000); // Hace 1 día + 1 segundo

      configService.get.mockReturnValue(0.5);

      // Act
      const fineAmount = service.calculateFine(dueAt);

      // Assert
      expect(fineAmount).toBe(0.5); // 1 día × 0.50 = 0.50
    });

    it('Debe calcular correctamente para 10 días atrasados', () => {
      // Arrange
      const now = new Date();
      const dueAt = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      configService.get.mockReturnValue(0.5);

      // Act
      const fineAmount = service.calculateFine(dueAt);

      // Assert
      expect(fineAmount).toBe(5.0); // 10 días × 0.50 = 5.00
    });
  });

  describe('returnLoan', () => {
    it('Debe retornar un préstamo activo cambiando el estado a RETURNED', async () => {
      // Arrange
      const loanId = 'loan-123';
      const now = new Date();

      const mockLoan: Loan = {
        id: loanId,
        userId: 'user-123',
        itemId: 'item-456',
        loanedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        returnedAt: undefined,
        status: LoanStatus.ACTIVE,
        fineAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as User,
        item: {} as Item,
      };

      const mockUser: User = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: UserRole.MEMBER,
        isActive: true,
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshTokens: [],
        loans: [],
      };

      loansRepository.findOne.mockResolvedValue(mockLoan);
      loansRepository.save.mockResolvedValue({
        ...mockLoan,
        returnedAt: now,
        status: LoanStatus.RETURNED,
      });
      configService.get.mockReturnValue(0.5);

      // Act
      const result = await service.returnLoan(loanId);

      // Assert
      expect(result.status).toBe(LoanStatus.RETURNED);
      expect(result.returnedAt).toBeDefined();
    });
  });
});
