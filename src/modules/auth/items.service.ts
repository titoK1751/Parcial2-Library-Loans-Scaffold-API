/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemType } from '@modules/auth/item.entity';
import { Loan, LoanStatus } from '@modules/auth/loan.entity';
import { CreateItemDto, UpdateItemDto, ItemResponseDto } from '@modules/auth/dtos';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(Loan)
    private loansRepository: Repository<Loan>,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<ItemResponseDto> {
    const { code, title, type } = createItemDto;

    // Verificar que el código sea único
    const existingItem = await this.itemsRepository.findOne({
      where: { code },
    });

    if (existingItem) {
      throw new ConflictException(
        `El código de artículo ${code} ya existe`,
      );
    }

    const item = this.itemsRepository.create({
      code,
      title,
      type,
      isActive: true,
    });

    const savedItem = await this.itemsRepository.save(item);
    return this.toResponseDto(savedItem);
  }

  async findAll(type?: ItemType): Promise<ItemResponseDto[]> {
    const query = this.itemsRepository.createQueryBuilder('item')
      .where('item.isActive = true');

    if (type) {
      query.andWhere('item.type = :type', { type });
    }

    const items = await query.orderBy('item.createdAt', 'DESC').getMany();

    return Promise.all(items.map((item) => this.toResponseDtoWithAvailability(item)));
  }

  async findById(id: string): Promise<ItemResponseDto> {
    const item = await this.itemsRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Artículo con ID ${id} no encontrado`);
    }

    if (!item.isActive) {
      throw new NotFoundException(`Artículo con ID ${id} no encontrado`);
    }

    return this.toResponseDtoWithAvailability(item);
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<ItemResponseDto> {
    const item = await this.itemsRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Artículo con ID ${id} no encontrado`);
    }

    if (!item.isActive) {
      throw new NotFoundException(`Artículo con ID ${id} no encontrado`);
    }

    if (updateItemDto.title !== undefined) {
      item.title = updateItemDto.title;
    }

    if (updateItemDto.type !== undefined) {
      item.type = updateItemDto.type;
    }

    const updatedItem = await this.itemsRepository.save(item);
    return this.toResponseDtoWithAvailability(updatedItem);
  }

  async delete(id: string): Promise<void> {
    const item = await this.itemsRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Artículo con ID ${id} no encontrado`);
    }

    if (!item.isActive) {
      throw new NotFoundException(`Artículo con ID ${id} no encontrado`);
    }

    item.isActive = false;
    await this.itemsRepository.save(item);
  }

  async isAvailable(itemId: string): Promise<boolean> {
    const activeLoan = await this.loansRepository.findOne({
      where: {
        itemId,
        status: LoanStatus.ACTIVE,
      },
    });

    return !activeLoan;
  }

  private async toResponseDtoWithAvailability(item: Item): Promise<ItemResponseDto> {
    const isAvailable = await this.isAvailable(item.id);
    return {
      id: item.id,
      code: item.code,
      title: item.title,
      type: item.type,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isAvailable,
    } as any;
  }

  private toResponseDto(item: Item): ItemResponseDto {
    return {
      id: item.id,
      code: item.code,
      title: item.title,
      type: item.type,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
