/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { RefreshToken } from './refresh-token.entity';
import { AuthService } from './auth.service';
import { LoansService } from './loans.service';
import { AuthController } from './auth.controller';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Item, Loan]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiresIn'),
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, ItemsService, LoansService],
  controllers: [AuthController, ItemsController, LoansController],
  exports: [AuthService, ItemsService, LoansService],
})
export class AuthModule {}