/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../auth/item.entity';
import { Loan } from '../auth/loan.entity';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Loan])],
  providers: [ItemsService],
  controllers: [ItemsController],
  exports: [ItemsService],
})
export class ItemsModule {}
