import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { invalidAccessToken } from './auth.errors';
import { AccessTokenClaims, AuthenticatedPrincipal } from './auth.types';

type AuthenticatedRequest = Request & { auth?: AuthenticatedPrincipal };

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw invalidAccessToken();
    }

    const token = authorization.slice('Bearer '.length).trim();

    if (!token) {
      throw invalidAccessToken();
    }

    let claims: AccessTokenClaims;

    try {
      claims = await this.jwtService.verifyAsync<AccessTokenClaims>(token);
    } catch {
      throw invalidAccessToken();
    }

    if (!claims.sub || !claims.email || !claims.sid || !claims.jti) {
      throw invalidAccessToken();
    }

    const session = await this.prisma.authSession.findUnique({
      where: { id: claims.sid },
      select: {
        userId: true,
        revokedAt: true,
        expiresAt: true,
        user: { select: { email: true, status: true } },
      },
    });

    if (
      !session ||
      session.userId !== claims.sub ||
      session.user.email !== claims.email ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date() ||
      session.user.status !== UserStatus.ACTIVE
    ) {
      throw invalidAccessToken();
    }

    request.auth = claims;
    return true;
  }
}
