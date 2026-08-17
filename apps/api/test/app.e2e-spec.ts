import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { UserStatus } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

interface AuthResponseBody {
  user: {
    id: string;
    email: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

interface TokenResponseBody {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

interface ErrorResponseBody {
  statusCode: number;
  code: string;
  message: string;
}

const SENSITIVE_RESPONSE_KEYS = new Set([
  'password',
  'passwordHash',
  'refreshTokenHash',
  'revokedAt',
  'lastUsedAt',
]);

function expectNoSensitiveFields(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(expectNoSensitiveFields);
    return;
  }

  if (typeof value !== 'object' || value === null) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    expect(SENSITIVE_RESPONSE_KEYS.has(key)).toBe(false);
    expectNoSensitiveFields(nestedValue);
  }
}

function sessionIdFromRefreshToken(refreshToken: string): string {
  return refreshToken.split('.', 1)[0];
}

describe('Authentication foundation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const testPrefix = `sprint13-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const mainEmail = `${testPrefix}-main@example.com`;
  const password = 'SecurePassword123';
  let mainAuth: AuthResponseBody;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.authSession.deleteMany({
      where: { user: { email: { startsWith: testPrefix } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: testPrefix } },
    });
    await app.close();
  });

  it('preserves the public root and database-backed health endpoint', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
    await request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
      api: 'ok',
      database: 'ok',
    });
  });

  it('registers, normalizes email, hashes secrets, and returns only safe fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `  ${mainEmail.toUpperCase()}  `, password })
      .expect(201);
    const responseBody: unknown = response.body;
    mainAuth = responseBody as AuthResponseBody;
    expect(mainAuth.user.email).toBe(mainEmail);
    expect(mainAuth.user.status).toBe('ACTIVE');
    expect(mainAuth.accessToken).toEqual(expect.any(String));
    expect(mainAuth.refreshToken).toEqual(expect.any(String));
    expect(mainAuth.tokenType).toBe('Bearer');
    expectNoSensitiveFields(response.body as unknown);

    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { email: mainEmail },
    });
    const storedSession = await prisma.authSession.findUniqueOrThrow({
      where: { id: sessionIdFromRefreshToken(mainAuth.refreshToken) },
    });
    expect(storedUser.passwordHash).not.toBe(password);
    await expect(
      argon2.verify(storedUser.passwordHash, password),
    ).resolves.toBe(true);
    expect(storedSession.refreshTokenHash).not.toBe(mainAuth.refreshToken);
    expect(storedSession.refreshTokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects duplicate registration with a stable conflict code', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: mainEmail, password })
      .expect(409);
    expect((response.body as unknown as ErrorResponseBody).code).toBe(
      'AUTH_EMAIL_ALREADY_EXISTS',
    );
  });

  it('rejects malformed, weak, and non-whitelisted registration input', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `${testPrefix}-weak@example.com`, password: 'short' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `${testPrefix}-extra@example.com`, password, admin: true })
      .expect(400);
  });

  it('logs in valid users and gives wrong-password and unknown-email the same response', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ` ${mainEmail.toUpperCase()} `, password })
      .expect(200);
    const loginBody = loginResponse.body as unknown as AuthResponseBody;
    expect(loginBody.user.email).toBe(mainEmail);
    expect(loginBody.refreshToken).not.toBe(mainAuth.refreshToken);
    expectNoSensitiveFields(loginResponse.body as unknown);

    const wrongPasswordResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: mainEmail, password: 'IncorrectPassword' })
      .expect(401);
    const unknownEmailResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `${testPrefix}-unknown@example.com`, password })
      .expect(401);
    const wrongBody =
      wrongPasswordResponse.body as unknown as ErrorResponseBody;
    const unknownBody =
      unknownEmailResponse.body as unknown as ErrorResponseBody;
    expect(wrongBody.code).toBe('AUTH_INVALID_CREDENTIALS');
    expect(unknownBody.code).toBe(wrongBody.code);
    expect(unknownBody.message).toBe(wrongBody.message);
    expect(wrongBody.message).toBe('Incorrect email or password.');
  });

  it('blocks login and refresh for an inactive account', async () => {
    const email = `${testPrefix}-inactive@example.com`;
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const auth = registration.body as unknown as AuthResponseBody;
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { status: UserStatus.INACTIVE },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(403);
    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: auth.refreshToken })
      .expect(403);
    expect((loginResponse.body as unknown as ErrorResponseBody).code).toBe(
      'AUTH_ACCOUNT_INACTIVE',
    );
    expect((refreshResponse.body as unknown as ErrorResponseBody).code).toBe(
      'AUTH_ACCOUNT_INACTIVE',
    );
  });

  it('protects /auth/me and returns an explicitly safe current user', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${mainAuth.accessToken}`)
      .expect(200);
    expect((response.body as unknown as AuthResponseBody['user']).email).toBe(
      mainEmail,
    );
    expectNoSensitiveFields(response.body as unknown);
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer definitely-not-a-jwt')
      .expect(401);
  });

  it('rotates refresh tokens and immediately rejects the old token', async () => {
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `${testPrefix}-rotation@example.com`, password })
      .expect(201);
    const original = registration.body as unknown as AuthResponseBody;
    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: original.refreshToken })
      .expect(200);
    const rotated = refreshResponse.body as unknown as TokenResponseBody;
    expect(rotated.accessToken).not.toBe(original.accessToken);
    expect(rotated.refreshToken).not.toBe(original.refreshToken);
    expect(rotated.tokenType).toBe('Bearer');
    expectNoSensitiveFields(refreshResponse.body as unknown);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: original.refreshToken })
      .expect(401);
  });

  it('rejects malformed, expired, and revoked refresh sessions', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'not-a-refresh-token' })
      .expect(401);

    const expiredRegistration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `${testPrefix}-expired@example.com`, password })
      .expect(201);
    const expiredAuth = expiredRegistration.body as unknown as AuthResponseBody;
    await prisma.authSession.update({
      where: { id: sessionIdFromRefreshToken(expiredAuth.refreshToken) },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: expiredAuth.refreshToken })
      .expect(401);

    const revokedRegistration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `${testPrefix}-revoked@example.com`, password })
      .expect(201);
    const revokedAuth = revokedRegistration.body as unknown as AuthResponseBody;
    await prisma.authSession.update({
      where: { id: sessionIdFromRefreshToken(revokedAuth.refreshToken) },
      data: { revokedAt: new Date() },
    });
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: revokedAuth.refreshToken })
      .expect(401);
  });

  it('revokes only the current device session on logout', async () => {
    const email = `${testPrefix}-devices@example.com`;
    const deviceARegistration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const deviceA = deviceARegistration.body as unknown as AuthResponseBody;
    const deviceBLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const deviceB = deviceBLogin.body as unknown as AuthResponseBody;
    expect(
      await prisma.authSession.count({ where: { userId: deviceA.user.id } }),
    ).toBe(2);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${deviceA.accessToken}`)
      .expect(204)
      .expect('');
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${deviceA.accessToken}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: deviceA.refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${deviceB.accessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: deviceB.refreshToken })
      .expect(200);
  });
});
