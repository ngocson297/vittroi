import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const userId = 'f3fb1396-e2b5-4873-85d5-f9e886ad72d4';
  const storedProfile = {
    id: '63a4ed7a-3dcc-4a26-925b-83120dc848b0',
    fullName: 'Nguyễn Thị Ánh',
    dateOfBirth: new Date('1995-08-21T00:00:00.000Z'),
    createdAt: new Date('2026-08-18T01:00:00.000Z'),
    updatedAt: new Date('2026-08-18T01:00:00.000Z'),
  };

  it('returns null when onboarding has no profile', async () => {
    const prisma = {
      motherProfile: { findUnique: jest.fn(() => Promise.resolve(null)) },
    };
    const service = new ProfileService(prisma as unknown as PrismaService);

    await expect(service.getForUser(userId)).resolves.toEqual({
      profile: null,
    });
  });

  it('trims a Unicode name and returns date-only output', async () => {
    const create = jest.fn(() => Promise.resolve(storedProfile));
    const prisma = {
      motherProfile: {
        findUnique: jest.fn(() => Promise.resolve(null)),
        create,
      },
    };
    const service = new ProfileService(prisma as unknown as PrismaService);

    const result = await service.createForUser(userId, {
      fullName: '  Nguyễn Thị Ánh  ',
      dateOfBirth: '1995-08-21',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          fullName: 'Nguyễn Thị Ánh',
          dateOfBirth: new Date('1995-08-21T00:00:00.000Z'),
        }) as unknown,
      }),
    );
    expect(result.profile).toEqual(
      expect.objectContaining({
        fullName: 'Nguyễn Thị Ánh',
        dateOfBirth: '1995-08-21',
      }),
    );
  });

  it('maps a create-time unique race to PROFILE_ALREADY_EXISTS', async () => {
    const uniqueError = Object.assign(new Error('Unique constraint'), {
      code: 'P2002',
    });
    const prisma = {
      motherProfile: {
        findUnique: jest.fn(() => Promise.resolve(null)),
        create: jest.fn(() => Promise.reject(uniqueError)),
      },
    };
    const service = new ProfileService(prisma as unknown as PrismaService);

    await expect(
      service.createForUser(userId, {
        fullName: 'Nguyễn Thị Ánh',
        dateOfBirth: '1995-08-21',
      }),
    ).rejects.toMatchObject({
      response: { code: 'PROFILE_ALREADY_EXISTS' },
      status: 409,
    });
  });

  it('rejects an empty update and a missing profile cleanly', async () => {
    const prisma = {
      motherProfile: { findUnique: jest.fn(() => Promise.resolve(null)) },
    };
    const service = new ProfileService(prisma as unknown as PrismaService);

    await expect(service.updateForUser(userId, {})).rejects.toMatchObject({
      response: { code: 'PROFILE_INVALID_INPUT' },
      status: 400,
    });
    await expect(
      service.updateForUser(userId, { fullName: 'Tên mới' }),
    ).rejects.toMatchObject({
      response: { code: 'PROFILE_NOT_FOUND' },
      status: 404,
    });
  });
});
