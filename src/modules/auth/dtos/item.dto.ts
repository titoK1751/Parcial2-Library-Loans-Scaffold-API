import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemType } from '../auth/item.entity';

export class CreateItemDto {
  @ApiProperty({
    example: 'BK-0042',
    description: 'Código único del artículo',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  @Matches(/^[A-Z]{2}-\d{4}$/, {
    message: 'El código debe seguir el formato XX-NNNN (ej. BK-0042)',
  })
  code!: string;

  @ApiProperty({
    example: 'Clean Code',
    description: 'Título del artículo',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example: 'book',
    enum: ItemType,
    description: 'Tipo de artículo',
  })
  @IsEnum(ItemType)
  type!: ItemType;
}

export class UpdateItemDto {
  @ApiPropertyOptional({
    example: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    description: 'Nuevo título del artículo',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: 'book',
    enum: ItemType,
    description: 'Nuevo tipo de artículo',
  })
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;
}

export class ItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  type!: ItemType;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
