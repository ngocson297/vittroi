import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Prisma, UserStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  emailAlreadyExists,
  inactiveAccount,
  invalidCredentials,
  invalidRefreshToken,
} from './auth.errors';
import {
  AccessTokenClaims,
  AuthResponse,
  AuthTokens,
  PublicUser,
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const REFRESH_TOKEN_PATTERN =
  /^(?<sessionId>[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(?<secret>[A-Za-z0-9_-]{43})$/i;

@Injectable()
export class AuthService {
  private readonly refreshTokenTtlDays: number;
  private readonly dummyPasswordHash: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.refreshTokenTtlDays = configService.getOrThrow<number>(
      'REFRESH_TOKEN_TTL_DAYS',
    );
    this.dummyPasswordHash = argon2.hash(randomBytes(32), {
      type: argon2.argon2id,
    });
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw emailAlreadyExists();
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: { email, passwordHash },
          select: PUBLIC_USER_SELECT,
        });
        const tokens = await this.createSessionTokens(transaction, user);
        return { user, ...tokens };
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw emailAlreadyExists();
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordHash = user?.passwordHash ?? (await this.dummyPasswordHash);
    const passwordMatches = await argon2.verify(passwordHash, dto.password);

    if (!user || !passwordMatches) {
      throw invalidCredentials();
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw inactiveAccount();
    }

    const tokens = await this.createSessionTokens(this.prisma, user);
    return { user: this.toPublicUser(user), ...tokens };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const parsedToken = this.parseRefreshToken(rawRefreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { id: parsedToken.sessionId },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date() ||
      !this.hashesMatch(session.refreshTokenHash, rawRefreshToken)
    ) {
      throw invalidRefreshToken();
    }

    if (session.user.status !== UserStatus.ACTIVE) {
      throw inactiveAccount();
    }

    const replacementToken = this.generateRefreshToken(session.id);
    const replacementHash = this.hashRefreshToken(replacementToken);
    const now = new Date();
    const updateResult = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: session.refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
        user: { status: UserStatus.ACTIVE },
      },
      data: { refreshTokenHash: replacementHash, lastUsedAt: now },
    });

    if (updateResult.count !== 1) {
      throw invalidRefreshToken();
    }

    return {
      accessToken: await this.signAccessToken(session.user, session.id),
      refreshToken: replacementToken,
      tokenType: 'Bearer',
    };
  }

  async logout(sessionId: string, userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });

    if (!user) {
      throw invalidCredentials();
    }

    return user;
  }

  private async createSessionTokens(
    database: Pick<PrismaService, 'authSession'>,
    user: PublicUser,
  ): Promise<AuthTokens> {
    const sessionId = randomUUID();
    const refreshToken = this.generateRefreshToken(sessionId);
    const expiresAt = new Date(
      Date.now() + this.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    );

    await database.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken: await this.signAccessToken(user, sessionId),
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  private async signAccessToken(
    user: Pick<PublicUser, 'id' | 'email'>,
    sessionId: string,
  ): Promise<string> {
    const claims: AccessTokenClaims = {
      sub: user.id,
      email: user.email,
      sid: sessionId,
      jti: randomUUID(),
    };
    return this.jwtService.signAsync(claims);
  }

  private generateRefreshToken(sessionId: string): string {
    return `${sessionId}.${randomBytes(32).toString('base64url')}`;
  }

  private parseRefreshToken(rawRefreshToken: string): {
    sessionId: string;
  } {
    const match = REFRESH_TOKEN_PATTERN.exec(rawRefreshToken);

    if (!match?.groups?.sessionId) {
      throw invalidRefreshToken();
    }

    return { sessionId: match.groups.sessionId };
  }

  private hashRefreshToken(rawRefreshToken: string): string {
    return createHash('sha256').update(rawRefreshToken).digest('hex');
  }

  private hashesMatch(storedHash: string, rawRefreshToken: string): boolean {
    const candidateHash = this.hashRefreshToken(rawRefreshToken);
    return timingSafeEqual(
      Buffer.from(storedHash, 'hex'),
      Buffer.from(candidateHash, 'hex'),
    );
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toPublicUser(user: PublicUser): PublicUser {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
