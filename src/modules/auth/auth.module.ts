/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { RefreshToken } from './refresh-token.entity';
import { Loan } from './loan.entity';
import { Item } from './item.entity';
import { AuthService } from './auth.service';
import { LoansService } from './loans.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Loan, Item]),
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
  providers: [AuthService, LoansService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, LoansService],
})
export class AuthModule {}