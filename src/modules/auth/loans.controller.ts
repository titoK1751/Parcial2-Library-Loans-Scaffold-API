/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { LoansService } from './loans.service';
import { CreateLoanDto, UpdateLoanDto, LoanResponseDto } from '@modules/auth/dtos';
import { LoanStatus } from '@modules/auth/loan.entity';

@ApiTags('Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(private loansService: LoansService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear un nuevo préstamo' })
  @ApiResponse({
    status: 201,
    description: 'Préstamo creado exitosamente',
    type: LoanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o artículo no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El artículo ya tiene un préstamo activo',
  })
  async create(@Body() createLoanDto: CreateLoanDto): Promise<LoanResponseDto> {
    return this.loansService.create(createLoanDto);
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Listar préstamos con filtros opcionales' })
  @ApiResponse({
    status: 200,
    description: 'Lista de préstamos',
    type: [LoanResponseDto],
  })
  async findAll(
    @Query('userId') userId?: string,
    @Query('itemId') itemId?: string,
    @Query('status') status?: LoanStatus,
  ): Promise<LoanResponseDto[]> {
    return this.loansService.findAll(userId, itemId, status);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Obtener detalle de un préstamo' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del préstamo',
    type: LoanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Préstamo no encontrado',
  })
  async findById(@Param('id') id: string): Promise<LoanResponseDto> {
    return this.loansService.findById(id);
  }

  @Patch(':id/return')
  @HttpCode(200)
  @ApiOperation({ summary: 'Marcar préstamo como devuelto' })
  @ApiResponse({
    status: 200,
    description: 'Préstamo marcado como devuelto',
    type: LoanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede devolver un préstamo en ese estado',
  })
  @ApiResponse({
    status: 404,
    description: 'Préstamo no encontrado',
  })
  async markReturned(@Param('id') id: string): Promise<LoanResponseDto> {
    return this.loansService.markReturned(id);
  }

  @Patch(':id/mark-lost')
  @HttpCode(200)
  @ApiOperation({ summary: 'Marcar préstamo como perdido' })
  @ApiResponse({
    status: 200,
    description: 'Préstamo marcado como perdido',
    type: LoanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede marcar como perdido un préstamo en ese estado',
  })
  @ApiResponse({
    status: 404,
    description: 'Préstamo no encontrado',
  })
  async markLost(@Param('id') id: string): Promise<LoanResponseDto> {
    return this.loansService.markLost(id);
  }
}
