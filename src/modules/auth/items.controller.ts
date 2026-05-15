/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
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
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, ItemResponseDto } from '../auth/dtos';
import { ItemType } from '../auth/item.entity';

@ApiTags('Items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear un nuevo item' })
  @ApiResponse({
    status: 201,
    description: 'Item creado exitosamente',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 409, description: 'Item con código duplicado' })
  create(@Body() createItemDto: CreateItemDto): Promise<ItemResponseDto> {
    return this.itemsService.create(createItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar items activos' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ItemType,
    description: 'Filtrar por tipo de item',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de items',
    type: [ItemResponseDto],
  })
  findAll(@Query('type') type?: ItemType): Promise<ItemResponseDto[]> {
    return this.itemsService.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un item' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del item',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  findOne(@Param('id') id: string): Promise<ItemResponseDto> {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un item' })
  @ApiResponse({
    status: 200,
    description: 'Item actualizado',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    return this.itemsService.update(id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft delete de un item' })
  @ApiResponse({ status: 204, description: 'Item eliminado' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  @ApiResponse({ status: 409, description: 'Item con préstamos activos' })
  remove(@Param('id') id: string): Promise<void> {
    return this.itemsService.remove(id);
  }
}
