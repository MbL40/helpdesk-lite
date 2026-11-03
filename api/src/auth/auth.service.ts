import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { UserModel } from '../generated/prisma/models.js';
import { requireEnv } from '../common/env.js';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });
    if (!organization) {
      throw new NotFoundException('Organización no encontrada');
    }

    const user = await this.prisma.user.findUnique({
      where: { orgId_email: { orgId: organization.id, email: dto.email } },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.issueTokens(user);
  }

  async refreshTokens(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (stored.revokedAt) {
      // Token ya rotado antes: esto es reuso, señal de robo.
      // Se revoca toda la familia de tokens del usuario para forzar re-login.
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: stored.userId },
    });

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user);
  }

  private async issueTokens(user: UserModel) {
    const payload = { sub: user.id, orgId: user.orgId, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: requireEnv('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = randomBytes(64).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
