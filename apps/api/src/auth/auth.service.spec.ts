import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { UserStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthResponse, PublicUser } from './auth.types';

describe('AuthService', () => {
  const user: PublicUser = {
    id: '76a25c1d-61a4-4e32-920f-0f1b55e38d9a',
    email: 'mom@example.com',
    status: UserStatus.ACTIVE,
    createdAt: new Date('2026-08-17T00:00:00.000Z'),
    updatedAt: new Date('2026-08-17T00:00:00.000Z'),
  };

  it('normalizes email, hashes the password with Argon2id, and stores only a refresh digest', async () => {
    let storedPasswordHash = '';
    let storedRefreshHash = '';

    const transaction = {
      user: {
        create: jest.fn(
          (args: {
            data: { email: string; passwordHash: string };
          }): Promise<PublicUser> => {
            storedPasswordHash = args.data.passwordHash;
            return Promise.resolve({ ...user, email: args.data.email });
          },
        ),
      },
      authSession: {
        create: jest.fn(
          (args: { data: { refreshTokenHash: string } }): Promise<object> => {
            storedRefreshHash = args.data.refreshTokenHash;
            return Promise.resolve({});
          },
        ),
      },
    };
    const prisma = {
      user: { findUnique: jest.fn(() => Promise.resolve(null)) },
      $transaction: jest.fn(
        async (
          callback: (database: typeof transaction) => Promise<AuthResponse>,
        ) => callback(transaction),
      ),
    };
    const jwtService = {
      signAsync: jest.fn(() => Promise.resolve('signed-access-token')),
    };
    const configService = {
      getOrThrow: jest.fn(() => 30),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );

    const result = await service.register({
      email: '  Mom@Example.COM ',
      password: 'SecurePassword123',
    });

    expect(result.user.email).toBe('mom@example.com');
    expect(result.tokenType).toBe('Bearer');
    expect(result.refreshToken).not.toBe(storedRefreshHash);
    expect(storedRefreshHash).toMatch(/^[0-9a-f]{64}$/);
    expect(storedPasswordHash).toMatch(/^\$argon2id\$/);
    await expect(
      argon2.verify(storedPasswordHash, 'SecurePassword123'),
    ).resolves.toBe(true);
  });

  it('rotates a refresh token with compare-and-swap semantics', async () => {
    const sessionId = 'e13f0332-f82c-4927-8491-b746744bda6b';
    const rawToken = `${sessionId}.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;
    const storedHash = createHash('sha256').update(rawToken).digest('hex');
    const session = {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: storedHash,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user,
    };
    let comparedRefreshHash = '';
    let replacementRefreshHash = '';
    const updateMany = jest.fn(
      (args: {
        where: { refreshTokenHash: string };
        data: { refreshTokenHash: string };
      }) => {
        comparedRefreshHash = args.where.refreshTokenHash;
        replacementRefreshHash = args.data.refreshTokenHash;
        return Promise.resolve({ count: 1 });
      },
    );
    const prisma = {
      authSession: {
        findUnique: jest.fn(() => Promise.resolve(session)),
        updateMany,
      },
    };
    const jwtService = {
      signAsync: jest.fn(() => Promise.resolve('new-access-token')),
    };
    const configService = {
      getOrThrow: jest.fn(() => 30),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );

    const result = await service.refresh(rawToken);

    expect(result.refreshToken).not.toBe(rawToken);
    expect(result.refreshToken.startsWith(`${sessionId}.`)).toBe(true);
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(comparedRefreshHash).toBe(storedHash);
    expect(replacementRefreshHash).toMatch(/^[0-9a-f]{64}$/);
    expect(replacementRefreshHash).not.toBe(storedHash);
  });
});
