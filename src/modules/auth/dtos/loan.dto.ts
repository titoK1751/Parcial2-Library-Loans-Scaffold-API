import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsDecimal,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus, LoanPriority } from '../auth/loan.entity';
import { Type } from 'class-transformer';

export class CreateLoanDto {
  @ApiProperty({
    description: 'UUID del usuario que realiza el préstamo',
  })
  @IsUUID('4')
  userId!: string;

  @ApiProperty({
    description: 'UUID del artículo a prestar',
  })
  @IsUUID('4')
  itemId!: string;

  @ApiProperty({
    example: '2026-05-15T10:08:50Z',
    description: 'Fecha y hora cuando se realiza el préstamo',
  })
  @IsDateString()
  loanedAt!: string;

  @ApiProperty({
    example: '2026-05-29T10:08:50Z',
    description: 'Fecha y hora de vencimiento del préstamo (debe ser > loanedAt)',
  })
  @IsDateString()
  dueAt!: string;

  @ApiPropertyOptional({
    example: 'normal',
    enum: LoanPriority,
    default: 'normal',
    description: 'Prioridad del préstamo',
  })
  @IsOptional()
  @IsEnum(LoanPriority)
  priority?: LoanPriority;
}

export class UpdateLoanDto {
  @ApiPropertyOptional({
    example: 'returned',
    enum: LoanStatus,
    description: 'Nuevo estado del préstamo',
  })
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @ApiPropertyOptional({
    example: '2026-05-25T10:08:50Z',
    description: 'Fecha de devolución del artículo',
  })
  @IsOptional()
  @IsDateString()
  returnedAt?: string;

  @ApiPropertyOptional({
    example: '15.50',
    description: 'Monto de la multa por retraso',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  fineAmount?: number;
}

export class LoanResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  itemId!: string;

  @ApiProperty()
  loanedAt!: Date;

  @ApiProperty()
  dueAt!: Date;

  @ApiPropertyOptional()
  returnedAt?: Date;

  @ApiProperty()
  status!: LoanStatus;

  @ApiProperty()
  priority!: LoanPriority;

  @ApiProperty()
  fineAmount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
