/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemType } from '../auth/item.entity';
import { Loan, LoanStatus } from '../auth/loan.entity';
import { CreateItemDto, UpdateItemDto, ItemResponseDto } from '../auth/dtos';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(Loan)
    private loansRepository: Repository<Loan>,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<ItemResponseDto> {
    const existingItem = await this.itemsRepository.findOne({
      where: { code: createItemDto.code },
    });

    if (existingItem) {
      throw new ConflictException(
        `Item con código ${createItemDto.code} ya existe`,
      );
    }

    const item = this.itemsRepository.create({
      code: createItemDto.code,
      title: createItemDto.title,
      type: createItemDto.type,
    });

    const savedItem = await this.itemsRepository.save(item);
    return this.mapToResponse(savedItem, true);
  }

  async findAll(type?: ItemType): Promise<ItemResponseDto[]> {
    const query = this.itemsRepository
      .createQueryBuilder('item')
      .where('item.isActive = :isActive', { isActive: true });

    if (type) {
      query.andWhere('item.type = :type', { type });
    }

    const items = await query.orderBy('item.createdAt', 'DESC').getMany();

    return Promise.all(
      items.map(async (item) => {
        const isAvailable = await this.checkItemAvailability(item.id);
        return this.mapToResponse(item, isAvailable);
      }),
    );
  }

  async findOne(id: string): Promise<ItemResponseDto> {
    const item = await this.itemsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!item) {
      throw new NotFoundException(`Item con ID ${id} no encontrado`);
    }

    const isAvailable = await this.checkItemAvailability(id);
    return this.mapToResponse(item, isAvailable);
  }

  async update(
    id: string,
    updateItemDto: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    const item = await this.itemsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!item) {
      throw new NotFoundException(`Item con ID ${id} no encontrado`);
    }

    if (updateItemDto.title) {
      item.title = updateItemDto.title;
    }

    if (updateItemDto.type) {
      item.type = updateItemDto.type;
    }

    const updatedItem = await this.itemsRepository.save(item);
    const isAvailable = await this.checkItemAvailability(id);
    return this.mapToResponse(updatedItem, isAvailable);
  }

  async remove(id: string): Promise<void> {
    const item = await this.itemsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!item) {
      throw new NotFoundException(`Item con ID ${id} no encontrado`);
    }

    // Verificar si hay préstamos activos
    const activeLoans = await this.loansRepository.count({
      where: {
        itemId: id,
        status: LoanStatus.ACTIVE,
      },
    });

    if (activeLoans > 0) {
      throw new ConflictException(
        'No se puede eliminar un item con préstamos activos',
      );
    }

    item.isActive = false;
    await this.itemsRepository.save(item);
  }

  private async checkItemAvailability(itemId: string): Promise<boolean> {
    const activeLoan = await this.loansRepository.findOne({
      where: {
        itemId,
        status: LoanStatus.ACTIVE,
      },
    });

    return !activeLoan;
  }

  private mapToResponse(
    item: Item,
    isAvailable: boolean,
  ): ItemResponseDto {
    return {
      id: item.id,
      code: item.code,
      title: item.title,
      type: item.type,
      isActive: item.isActive,
      isAvailable,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
