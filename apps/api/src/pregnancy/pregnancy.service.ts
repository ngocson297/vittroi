import { Injectable } from '@nestjs/common';
import { PregnancyStatus, Prisma } from '../generated/prisma/client';
import {
  isOnboardingDueDateInRange,
  parseDateOnly,
  serializeDateOnly,
} from '../common/date-only';
import { isUniqueConstraintError } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePregnancyDto } from './dto/create-pregnancy.dto';
import {
  activePregnancyAlreadyExists,
  invalidDueDate,
  profileRequired,
} from './pregnancy.errors';
import {
  PregnanciesResponse,
  PregnancyResponse,
  PregnancyView,
} from './pregnancy.types';

const PREGNANCY_SELECT = {
  id: true,
  dueDate: true,
  status: true,
  actualBirthDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedPregnancy = Prisma.PregnancyGetPayload<{
  select: typeof PREGNANCY_SELECT;
}>;

@Injectable()
export class PregnancyService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<PregnanciesResponse> {
    const pregnancies = await this.prisma.pregnancy.findMany({
      where: { motherProfile: { userId } },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
        { dueDate: 'desc' },
        { id: 'desc' },
      ],
      select: PREGNANCY_SELECT,
    });

    return { pregnancies: pregnancies.map((item) => this.toView(item)) };
  }

  async getCurrentForUser(userId: string): Promise<PregnancyResponse> {
    const pregnancy = await this.prisma.pregnancy.findFirst({
      where: {
        status: PregnancyStatus.ACTIVE,
        motherProfile: { userId },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: PREGNANCY_SELECT,
    });

    return { pregnancy: pregnancy ? this.toView(pregnancy) : null };
  }

  async createForUser(
    userId: string,
    dto: CreatePregnancyDto,
  ): Promise<PregnancyResponse> {
    const dueDate = parseDateOnly(dto.dueDate);

    if (!dueDate || !isOnboardingDueDateInRange(dto.dueDate)) {
      throw invalidDueDate();
    }

    const profile = await this.prisma.motherProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        pregnancies: {
          where: { status: PregnancyStatus.ACTIVE },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!profile) {
      throw profileRequired();
    }

    if (profile.pregnancies.length > 0) {
      throw activePregnancyAlreadyExists();
    }

    try {
      const pregnancy = await this.prisma.pregnancy.create({
        data: {
          motherProfileId: profile.id,
          dueDate,
          status: PregnancyStatus.ACTIVE,
        },
        select: PREGNANCY_SELECT,
      });
      return { pregnancy: this.toView(pregnancy) };
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw activePregnancyAlreadyExists();
      }
      throw error;
    }
  }

  private toView(pregnancy: SelectedPregnancy): PregnancyView {
    return {
      id: pregnancy.id,
      dueDate: serializeDateOnly(pregnancy.dueDate),
      status: pregnancy.status,
      actualBirthDate: pregnancy.actualBirthDate
        ? serializeDateOnly(pregnancy.actualBirthDate)
        : null,
      createdAt: pregnancy.createdAt.toISOString(),
      updatedAt: pregnancy.updatedAt.toISOString(),
    };
  }
}
