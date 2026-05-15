/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RefreshToken } from './refresh-token.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, role } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(`Usuario con email ${email} ya existe`);
    }

    // Hash de la contraseña
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear el nuevo usuario
    const user = this.usersRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
    });

    await this.usersRepository.save(user);

    // Generar tokens
    return this.generateTokensResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Buscar el usuario
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Generar tokens
    return this.generateTokensResponse(user);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    // Verificar que el token exista en BD
    const tokenRecord = await this.refreshTokensRepository.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: ['user'],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token inválido o revocado');
    }

    // Verificar que no haya expirado
    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = tokenRecord.user;

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Generar nuevos tokens
    return this.generateTokensResponse(user);
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const tokenRecord = await this.refreshTokensRepository.findOne({
      where: { token: refreshToken },
    });

    if (tokenRecord) {
      tokenRecord.isRevoked = true;
      await this.refreshTokensRepository.save(tokenRecord);
    }

    return { message: 'Logout exitoso' };
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private async generateTokensResponse(user: User): Promise<AuthResponseDto> {
    // Generar access token
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
      },
    );

    // Generar refresh token
    const refreshTokenValue = this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      },
    );

    // Guardar refresh token en BD
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await this.refreshTokensRepository.save({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt,
      isRevoked: false,
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
