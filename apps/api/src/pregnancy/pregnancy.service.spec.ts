import { addDateOnlyDays, localTodayDateOnly } from '../common/date-only';
import { PregnancyStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PregnancyService } from './pregnancy.service';

describe('PregnancyService', () => {
  const userId = 'f3fb1396-e2b5-4873-85d5-f9e886ad72d4';
  const profileId = '63a4ed7a-3dcc-4a26-925b-83120dc848b0';
  const dueDate = addDateOnlyDays(localTodayDateOnly(), 100);
  const storedPregnancy = {
    id: '5bcfbd26-790c-4cc5-a98a-222b4c92ea58',
    dueDate: new Date(`${dueDate}T00:00:00.000Z`),
    status: PregnancyStatus.ACTIVE,
    actualBirthDate: null,
    createdAt: new Date('2026-08-18T01:00:00.000Z'),
    updatedAt: new Date('2026-08-18T01:00:00.000Z'),
  };

  it('returns clean empty onboarding states with ownership-scoped queries', async () => {
    const findMany = jest.fn(() => Promise.resolve([]));
    const findFirst = jest.fn(() => Promise.resolve(null));
    const prisma = { pregnancy: { findMany, findFirst } };
    const service = new PregnancyService(prisma as unknown as PrismaService);

    await expect(service.listForUser(userId)).resolves.toEqual({
      pregnancies: [],
    });
    await expect(service.getCurrentForUser(userId)).resolves.toEqual({
      pregnancy: null,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { motherProfile: { userId } } }),
    );
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: PregnancyStatus.ACTIVE,
          motherProfile: { userId },
        },
      }),
    );
  });

  it('requires a profile and rejects an existing ACTIVE pregnancy', async () => {
    const prismaWithoutProfile = {
      motherProfile: { findUnique: jest.fn(() => Promise.resolve(null)) },
    };
    const missingProfileService = new PregnancyService(
      prismaWithoutProfile as unknown as PrismaService,
    );
    await expect(
      missingProfileService.createForUser(userId, { dueDate }),
    ).rejects.toMatchObject({
      response: { code: 'PROFILE_REQUIRED' },
      status: 409,
    });

    const prismaWithActive = {
      motherProfile: {
        findUnique: jest.fn(() =>
          Promise.resolve({ id: profileId, pregnancies: [{ id: 'active' }] }),
        ),
      },
    };
    const existingService = new PregnancyService(
      prismaWithActive as unknown as PrismaService,
    );
    await expect(
      existingService.createForUser(userId, { dueDate }),
    ).rejects.toMatchObject({
      response: { code: 'ACTIVE_PREGNANCY_ALREADY_EXISTS' },
      status: 409,
    });
  });

  it('derives ownership and ACTIVE status instead of accepting client IDs', async () => {
    const create = jest.fn(() => Promise.resolve(storedPregnancy));
    const prisma = {
      motherProfile: {
        findUnique: jest.fn(() =>
          Promise.resolve({ id: profileId, pregnancies: [] }),
        ),
      },
      pregnancy: { create },
    };
    const service = new PregnancyService(prisma as unknown as PrismaService);

    const result = await service.createForUser(userId, { dueDate });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          motherProfileId: profileId,
          dueDate: new Date(`${dueDate}T00:00:00.000Z`),
          status: PregnancyStatus.ACTIVE,
        },
      }),
    );
    expect(result.pregnancy).toEqual(
      expect.objectContaining({ dueDate, status: PregnancyStatus.ACTIVE }),
    );
  });

  it('maps a partial-index race to the stable ACTIVE conflict', async () => {
    const uniqueError = Object.assign(new Error('Unique constraint'), {
      code: '23505',
    });
    const prisma = {
      motherProfile: {
        findUnique: jest.fn(() =>
          Promise.resolve({ id: profileId, pregnancies: [] }),
        ),
      },
      pregnancy: {
        create: jest.fn(() => Promise.reject(uniqueError)),
      },
    };
    const service = new PregnancyService(prisma as unknown as PrismaService);

    await expect(
      service.createForUser(userId, { dueDate }),
    ).rejects.toMatchObject({
      response: { code: 'ACTIVE_PREGNANCY_ALREADY_EXISTS' },
      status: 409,
    });
  });
});
