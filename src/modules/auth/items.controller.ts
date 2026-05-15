/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, ItemResponseDto } from '@modules/auth/dtos';
import { ItemType } from '@modules/auth/item.entity';

@ApiTags('Items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear un nuevo artículo' })
  @ApiResponse({
    status: 201,
    description: 'Artículo creado exitosamente',
    type: ItemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'El código de artículo ya existe',
  })
  async create(@Body() createItemDto: CreateItemDto): Promise<ItemResponseDto> {
    return this.itemsService.create(createItemDto);
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Listar artículos activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de artículos',
    type: [ItemResponseDto],
  })
  async findAll(@Query('type') type?: ItemType): Promise<ItemResponseDto[]> {
    return this.itemsService.findAll(type);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Obtener detalle de un artículo' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del artículo',
    type: ItemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Artículo no encontrado',
  })
  async findById(@Param('id') id: string): Promise<ItemResponseDto> {
    return this.itemsService.findById(id);
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Actualizar un artículo' })
  @ApiResponse({
    status: 200,
    description: 'Artículo actualizado',
    type: ItemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Artículo no encontrado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    return this.itemsService.update(id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar un artículo (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'Artículo eliminado',
  })
  @ApiResponse({
    status: 404,
    description: 'Artículo no encontrado',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.itemsService.delete(id);
  }
}
