/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto } from './dtos';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Usuario con ese email ya existe',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refrescar access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    if (!refreshTokenDto.refreshToken) {
      throw new BadRequestException('refreshToken es requerido');
    }
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Logout exitoso',
  })
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    if (!refreshTokenDto.refreshToken) {
      throw new BadRequestException('refreshToken es requerido');
    }
    return this.authService.logout(refreshTokenDto.refreshToken);
  }
}