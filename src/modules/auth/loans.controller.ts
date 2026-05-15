/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoansService } from './loans.service';
import { CreateLoanDto, UpdateLoanDto, LoanResponseDto } from '../auth/dtos';
import { LoanStatus } from '../auth/loan.entity';

@ApiTags('Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear un nuevo préstamo' })
  @ApiResponse({
    status: 201,
    description: 'Préstamo creado exitosamente',
    type: LoanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'DTO inválido o regla de negocio violada' })
  @ApiResponse({ status: 404, description: 'Usuario o item no encontrado' })
  @ApiResponse({ status: 409, description: 'Item ya está prestado' })
  create(@Body() createLoanDto: CreateLoanDto): Promise<LoanResponseDto> {
    return this.loansService.create(createLoanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar préstamos' })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filtrar por usuario',
  })
  @ApiQuery({
    name: 'itemId',
    required: false,
    type: String,
    description: 'Filtrar por item',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: LoanStatus,
    description: 'Filtrar por estado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de préstamos',
    type: [LoanResponseDto],
  })
  findAll(
    @Query('userId') userId?: string,
    @Query('itemId') itemId?: string,
    @Query('status') status?: LoanStatus,
  ): Promise<LoanResponseDto[]> {
    return this.loansService.findAll(userId, itemId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un préstamo' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del préstamo',
    type: LoanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Préstamo no encontrado' })
  findOne(@Param('id') id: string): Promise<LoanResponseDto> {
    return this.loansService.findOne(id);
  }

  @Patch(':id/return')
  @ApiOperation({ summary: 'Marcar préstamo como devuelto y calcular multa' })
  @ApiResponse({
    status: 200,
    description: 'Préstamo marcado como devuelto',
    type: LoanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Préstamo no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Préstamo no está en estado activo',
  })
  markAsReturned(@Param('id') id: string): Promise<LoanResponseDto> {
    return this.loansService.markAsReturned(id);
  }

  @Patch(':id/mark-lost')
  @ApiOperation({ summary: 'Marcar préstamo como perdido' })
  @ApiResponse({
    status: 200,
    description: 'Préstamo marcado como perdido',
    type: LoanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Préstamo no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Préstamo ya está devuelto o perdido',
  })
  markAsLost(@Param('id') id: string): Promise<LoanResponseDto> {
    return this.loansService.markAsLost(id);
  }
}
