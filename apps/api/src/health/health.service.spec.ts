import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const queryRaw = jest.fn();
  const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
  const service = new HealthService(prisma);

  beforeEach(() => {
    queryRaw.mockReset();
  });

  it('reports the API and database as healthy after a successful query', async () => {
    queryRaw.mockResolvedValue([{ result: 1 }]);

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      api: 'ok',
      database: 'ok',
    });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns a service unavailable error when the database query fails', async () => {
    queryRaw.mockRejectedValue(new Error('database unavailable'));

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
