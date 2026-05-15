/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from '../auth/loan.entity';
import { Item } from '../auth/item.entity';
import { User } from '../auth/user.entity';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, Item, User])],
  providers: [LoansService],
  controllers: [LoansController],
  exports: [LoansService],
})
export class LoansModule {}
