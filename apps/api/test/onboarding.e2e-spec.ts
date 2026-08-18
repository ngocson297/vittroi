import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { addDateOnlyDays, localTodayDateOnly } from '../src/common/date-only';
import { PregnancyStatus } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

jest.setTimeout(30_000);

interface AuthResponseBody {
  user: { id: string; email: string };
  accessToken: string;
}

interface ErrorResponseBody {
  code: string;
}

interface ProfileBody {
  id: string;
  fullName: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileResponseBody {
  profile: ProfileBody | null;
}

interface PregnancyBody {
  id: string;
  dueDate: string;
  status: 'ACTIVE' | 'COMPLETED';
  actualBirthDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PregnancyResponseBody {
  pregnancy: PregnancyBody | null;
}

interface PregnanciesResponseBody {
  pregnancies: PregnancyBody[];
}

function authorization(auth: AuthResponseBody): string {
  return `Bearer ${auth.accessToken}`;
}

function expectNoOwnershipFields(value: object): void {
  expect(value).not.toHaveProperty('userId');
  expect(value).not.toHaveProperty('motherProfileId');
}

describe('Mother profile and pregnancy onboarding (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const testPrefix = `sprint15-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const password = 'SecurePassword123';
  const today = localTodayDateOnly();
  const validDueDate = addDateOnlyDays(today, 100);
  let userA: AuthResponseBody;
  let userB: AuthResponseBody;

  async function register(suffix: string): Promise<AuthResponseBody> {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `${testPrefix}-${suffix}@example.com`, password })
      .expect(201);
    const body: unknown = response.body;
    return body as AuthResponseBody;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    userA = await register('a');
    userB = await register('b');
  });

  afterAll(async () => {
    await prisma.pregnancy.deleteMany({
      where: {
        motherProfile: { user: { email: { startsWith: testPrefix } } },
      },
    });
    await prisma.motherProfile.deleteMany({
      where: { user: { email: { startsWith: testPrefix } } },
    });
    await prisma.authSession.deleteMany({
      where: { user: { email: { startsWith: testPrefix } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: testPrefix } },
    });
    await app.close();
  });

  it('protects all six onboarding routes', async () => {
    await request(app.getHttpServer()).get('/me/profile').expect(401);
    await request(app.getHttpServer()).post('/me/profile').send({}).expect(401);
    await request(app.getHttpServer())
      .patch('/me/profile')
      .send({})
      .expect(401);
    await request(app.getHttpServer()).get('/me/pregnancies').expect(401);
    await request(app.getHttpServer())
      .get('/me/pregnancies/current')
      .expect(401);
    await request(app.getHttpServer())
      .post('/me/pregnancies')
      .send({})
      .expect(401);
  });

  it('returns nullable/empty states and requires a profile before pregnancy', async () => {
    const profileResponse = await request(app.getHttpServer())
      .get('/me/profile')
      .set('Authorization', authorization(userA))
      .expect(200);
    const listResponse = await request(app.getHttpServer())
      .get('/me/pregnancies')
      .set('Authorization', authorization(userA))
      .expect(200);
    const currentResponse = await request(app.getHttpServer())
      .get('/me/pregnancies/current')
      .set('Authorization', authorization(userA))
      .expect(200);
    expect(
      (profileResponse.body as unknown as ProfileResponseBody).profile,
    ).toBe(null);
    expect(
      (listResponse.body as unknown as PregnanciesResponseBody).pregnancies,
    ).toEqual([]);
    expect(
      (currentResponse.body as unknown as PregnancyResponseBody).pregnancy,
    ).toBe(null);

    const createResponse = await request(app.getHttpServer())
      .post('/me/pregnancies')
      .set('Authorization', authorization(userA))
      .send({ dueDate: validDueDate })
      .expect(409);
    expect((createResponse.body as unknown as ErrorResponseBody).code).toBe(
      'PROFILE_REQUIRED',
    );
  });

  it('validates profile dates, Unicode names, and rejected ownership fields', async () => {
    await request(app.getHttpServer())
      .post('/me/profile')
      .set('Authorization', authorization(userA))
      .send({ fullName: '   ', dateOfBirth: '1995-08-21' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/me/profile')
      .set('Authorization', authorization(userA))
      .send({ fullName: 'Nguyễn Thị Ánh', dateOfBirth: '2023-02-29' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/me/profile')
      .set('Authorization', authorization(userA))
      .send({
        fullName: 'Nguyễn Thị Ánh',
        dateOfBirth: addDateOnlyDays(today, 1),
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/me/profile')
      .set('Authorization', authorization(userA))
      .send({
        fullName: 'Nguyễn Thị Ánh',
        dateOfBirth: '1995-08-21',
        userId: userB.user.id,
      })
      .expect(400);

    const response = await request(app.getHttpServer())
      .post('/me/profile')
      .set('Authorization', authorization(userA))
      .send({ fullName: '  Nguyễn Thị Ánh  ', dateOfBirth: '1995-08-21' })
      .expect(201);
    const body = response.body as unknown as ProfileResponseBody;
    expect(body.profile).toEqual(
      expect.objectContaining({
        fullName: 'Nguyễn Thị Ánh',
        dateOfBirth: '1995-08-21',
      }),
    );
    expectNoOwnershipFields(body.profile as ProfileBody);

    const duplicateResponse = await request(app.getHttpServer())
      .post('/me/profile')
      .set('Authorization', authorization(userA))
      .send({ fullName: 'Tên khác', dateOfBirth: '1990-01-01' })
      .expect(409);
    expect((duplicateResponse.body as unknown as ErrorResponseBody).code).toBe(
      'PROFILE_ALREADY_EXISTS',
    );
  });

  it('updates only allowed profile fields and reports a missing profile', async () => {
    const missingResponse = await request(app.getHttpServer())
      .patch('/me/profile')
      .set('Authorization', authorization(userB))
      .send({ fullName: 'Mẹ B' })
      .expect(404);
    expect((missingResponse.body as unknown as ErrorResponseBody).code).toBe(
      'PROFILE_NOT_FOUND',
    );
    await request(app.getHttpServer())
      .patch('/me/profile')
      .set('Authorization', authorization(userA))
      .send({ fullName: null })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/me/profile')
      .set('Authorization', authorization(userA))
      .send({ id: randomUUID() })
      .expect(400);

    const response = await request(app.getHttpServer())
      .patch('/me/profile')
      .set('Authorization', authorization(userA))
      .send({ fullName: '  Nguyễn Thị An  ', dateOfBirth: '1994-07-20' })
      .expect(200);
    const body = response.body as unknown as ProfileResponseBody;
    expect(body.profile).toEqual(
      expect.objectContaining({
        fullName: 'Nguyễn Thị An',
        dateOfBirth: '1994-07-20',
      }),
    );
    expectNoOwnershipFields(body.profile as ProfileBody);
  });

  it('isolates profile and pregnancy state between authenticated users', async () => {
    await request(app.getHttpServer())
      .post('/me/profile')
      .set('Authorization', authorization(userB))
      .send({ fullName: 'Mẹ B', dateOfBirth: '1992-02-02' })
      .expect(201);
    const userBPregnancyResponse = await request(app.getHttpServer())
      .post('/me/pregnancies')
      .set('Authorization', authorization(userB))
      .send({ dueDate: addDateOnlyDays(today, 120) })
      .expect(201);
    const userBPregnancy = (
      userBPregnancyResponse.body as unknown as PregnancyResponseBody
    ).pregnancy as PregnancyBody;

    await request(app.getHttpServer())
      .patch('/me/profile')
      .set('Authorization', authorization(userA))
      .send({ fullName: 'Mẹ A riêng' })
      .expect(200);
    const userBProfileResponse = await request(app.getHttpServer())
      .get('/me/profile')
      .set('Authorization', authorization(userB))
      .expect(200);
    expect(
      (userBProfileResponse.body as unknown as ProfileResponseBody).profile
        ?.fullName,
    ).toBe('Mẹ B');

    const profileResponse = await request(app.getHttpServer())
      .get('/me/profile')
      .set('Authorization', authorization(userA))
      .expect(200);
    const profile = (profileResponse.body as unknown as ProfileResponseBody)
      .profile as ProfileBody;
    expect(profile.fullName).toBe('Mẹ A riêng');
    expect(profile.fullName).not.toBe('Mẹ B');

    const listResponse = await request(app.getHttpServer())
      .get('/me/pregnancies')
      .set('Authorization', authorization(userA))
      .expect(200);
    const currentResponse = await request(app.getHttpServer())
      .get('/me/pregnancies/current')
      .set('Authorization', authorization(userA))
      .expect(200);
    expect(
      (listResponse.body as unknown as PregnanciesResponseBody).pregnancies,
    ).toEqual([]);
    expect(
      (currentResponse.body as unknown as PregnancyResponseBody).pregnancy,
    ).toBe(null);
    expectNoOwnershipFields(userBPregnancy);
  });

  it('validates due dates and prevents client-selected ownership/status', async () => {
    await request(app.getHttpServer())
      .post('/me/pregnancies')
      .set('Authorization', authorization(userA))
      .send({ dueDate: '2026-02-29' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/me/pregnancies')
      .set('Authorization', authorization(userA))
      .send({ dueDate: addDateOnlyDays(today, -22) })
      .expect(400);
    await request(app.getHttpServer())
      .post('/me/pregnancies')
      .set('Authorization', authorization(userA))
      .send({ dueDate: addDateOnlyDays(today, 302) })
      .expect(400);
    await request(app.getHttpServer())
      .post('/me/pregnancies')
      .set('Authorization', authorization(userA))
      .send({
        dueDate: validDueDate,
        motherProfileId: randomUUID(),
        status: 'COMPLETED',
        actualBirthDate: today,
      })
      .expect(400);
  });

  it('creates one ACTIVE pregnancy and maps a second request to conflict', async () => {
    const response = await request(app.getHttpServer())
      .post('/me/pregnancies')
      .set('Authorization', authorization(userA))
      .send({ dueDate: validDueDate })
      .expect(201);
    const pregnancy = (response.body as unknown as PregnancyResponseBody)
      .pregnancy as PregnancyBody;
    expect(pregnancy).toEqual(
      expect.objectContaining({
        dueDate: validDueDate,
        status: 'ACTIVE',
        actualBirthDate: null,
      }),
    );
    expectNoOwnershipFields(pregnancy);

    const duplicateResponse = await request(app.getHttpServer())
      .post('/me/pregnancies')
      .set('Authorization', authorization(userA))
      .send({ dueDate: addDateOnlyDays(today, 110) })
      .expect(409);
    expect((duplicateResponse.body as unknown as ErrorResponseBody).code).toBe(
      'ACTIVE_PREGNANCY_ALREADY_EXISTS',
    );
  });

  it('returns ACTIVE first and uses deterministic completed-pregnancy ordering', async () => {
    const profile = await prisma.motherProfile.findUniqueOrThrow({
      where: { userId: userA.user.id },
      select: { id: true },
    });
    const completedIds = [randomUUID(), randomUUID()];
    const tiedCreatedAt = new Date('2025-01-01T00:00:00.000Z');
    const historicalDueDate = new Date('2024-12-01T00:00:00.000Z');
    const actualBirthDate = new Date('2024-11-30T00:00:00.000Z');
    await Promise.all(
      completedIds.map((id) =>
        prisma.pregnancy.create({
          data: {
            id,
            motherProfileId: profile.id,
            dueDate: historicalDueDate,
            actualBirthDate,
            status: PregnancyStatus.COMPLETED,
            createdAt: tiedCreatedAt,
          },
        }),
      ),
    );

    const listResponse = await request(app.getHttpServer())
      .get('/me/pregnancies')
      .set('Authorization', authorization(userA))
      .expect(200);
    const pregnancies = (
      listResponse.body as unknown as PregnanciesResponseBody
    ).pregnancies;
    const expectedCompletedIds = [...completedIds].sort((left, right) =>
      left < right ? 1 : -1,
    );
    expect(pregnancies).toHaveLength(3);
    expect(pregnancies[0].status).toBe('ACTIVE');
    expect(pregnancies.slice(1).map(({ id }) => id)).toEqual(
      expectedCompletedIds,
    );
    expect(pregnancies[1].dueDate).toBe('2024-12-01');
    expect(pregnancies[1].actualBirthDate).toBe('2024-11-30');
    pregnancies.forEach(expectNoOwnershipFields);

    const currentResponse = await request(app.getHttpServer())
      .get('/me/pregnancies/current')
      .set('Authorization', authorization(userA))
      .expect(200);
    const current = (currentResponse.body as unknown as PregnancyResponseBody)
      .pregnancy as PregnancyBody;
    expect(current.status).toBe('ACTIVE');
    expect(current.dueDate).toBe(validDueDate);
    expectNoOwnershipFields(current);
  });

  it('is race-safe for concurrent profile and ACTIVE pregnancy creation', async () => {
    const profileRaceUser = await register('profile-race');
    const profileRequests = await Promise.all([
      request(app.getHttpServer())
        .post('/me/profile')
        .set('Authorization', authorization(profileRaceUser))
        .send({ fullName: 'Mẹ Race', dateOfBirth: '1991-01-01' }),
      request(app.getHttpServer())
        .post('/me/profile')
        .set('Authorization', authorization(profileRaceUser))
        .send({ fullName: 'Mẹ Race', dateOfBirth: '1991-01-01' }),
    ]);
    expect(profileRequests.map(({ status }) => status).sort()).toEqual([
      201, 409,
    ]);
    expect(
      profileRequests.find(({ status }) => status === 409)?.body as unknown,
    ).toEqual(expect.objectContaining({ code: 'PROFILE_ALREADY_EXISTS' }));
    await expect(
      prisma.motherProfile.count({
        where: { userId: profileRaceUser.user.id },
      }),
    ).resolves.toBe(1);

    const pregnancyRaceUser = await register('pregnancy-race');
    await request(app.getHttpServer())
      .post('/me/profile')
      .set('Authorization', authorization(pregnancyRaceUser))
      .send({ fullName: 'Mẹ Pregnancy Race', dateOfBirth: '1993-03-03' })
      .expect(201);
    const pregnancyRequests = await Promise.all([
      request(app.getHttpServer())
        .post('/me/pregnancies')
        .set('Authorization', authorization(pregnancyRaceUser))
        .send({ dueDate: addDateOnlyDays(today, 130) }),
      request(app.getHttpServer())
        .post('/me/pregnancies')
        .set('Authorization', authorization(pregnancyRaceUser))
        .send({ dueDate: addDateOnlyDays(today, 140) }),
    ]);
    expect(pregnancyRequests.map(({ status }) => status).sort()).toEqual([
      201, 409,
    ]);
    expect(
      pregnancyRequests.find(({ status }) => status === 409)?.body as unknown,
    ).toEqual(
      expect.objectContaining({ code: 'ACTIVE_PREGNANCY_ALREADY_EXISTS' }),
    );
    await expect(
      prisma.pregnancy.count({
        where: {
          status: PregnancyStatus.ACTIVE,
          motherProfile: { userId: pregnancyRaceUser.user.id },
        },
      }),
    ).resolves.toBe(1);
  });
});
