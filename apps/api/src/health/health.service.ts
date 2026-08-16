import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthResponse {
  status: 'ok';
  api: 'ok';
  database: 'ok';
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    try {
      await this.prisma.$queryRaw<
        Array<{ result: number }>
      >`SELECT 1 AS result`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        api: 'ok',
        database: 'error',
      });
    }

    return {
      status: 'ok',
      api: 'ok',
      database: 'ok',
    };
  }
}
