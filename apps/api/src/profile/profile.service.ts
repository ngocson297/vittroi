import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import {
  isDateOfBirthInRange,
  parseDateOnly,
  serializeDateOnly,
} from '../common/date-only';
import { isUniqueConstraintError } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  invalidProfileInput,
  profileAlreadyExists,
  profileNotFound,
} from './profile.errors';
import { MotherProfileResponse, MotherProfileView } from './profile.types';

const PROFILE_SELECT = {
  id: true,
  fullName: true,
  dateOfBirth: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedProfile = Prisma.MotherProfileGetPayload<{
  select: typeof PROFILE_SELECT;
}>;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string): Promise<MotherProfileResponse> {
    const profile = await this.prisma.motherProfile.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    });

    return { profile: profile ? this.toView(profile) : null };
  }

  async createForUser(
    userId: string,
    dto: CreateProfileDto,
  ): Promise<MotherProfileResponse> {
    const fullName = dto.fullName.trim();
    const dateOfBirth = parseDateOnly(dto.dateOfBirth);

    if (!fullName || fullName.length > 200 || !dateOfBirth) {
      throw invalidProfileInput(
        'A valid full name and date of birth are required.',
      );
    }

    if (!isDateOfBirthInRange(dto.dateOfBirth)) {
      throw invalidProfileInput(
        'Date of birth must be from 1900-01-01 through today.',
      );
    }

    const existing = await this.prisma.motherProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existing) {
      throw profileAlreadyExists();
    }

    try {
      const profile = await this.prisma.motherProfile.create({
        data: { userId, fullName, dateOfBirth },
        select: PROFILE_SELECT,
      });
      return { profile: this.toView(profile) };
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw profileAlreadyExists();
      }
      throw error;
    }
  }

  async updateForUser(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<MotherProfileResponse> {
    if (dto.fullName === undefined && dto.dateOfBirth === undefined) {
      throw invalidProfileInput('At least one profile field is required.');
    }

    const data: { fullName?: string; dateOfBirth?: Date } = {};

    if (dto.fullName !== undefined) {
      const fullName = dto.fullName.trim();
      if (!fullName || fullName.length > 200) {
        throw invalidProfileInput('A valid full name is required.');
      }
      data.fullName = fullName;
    }

    if (dto.dateOfBirth !== undefined) {
      const dateOfBirth = parseDateOnly(dto.dateOfBirth);
      if (!dateOfBirth || !isDateOfBirthInRange(dto.dateOfBirth)) {
        throw invalidProfileInput(
          'Date of birth must be from 1900-01-01 through today.',
        );
      }
      data.dateOfBirth = dateOfBirth;
    }

    const existing = await this.prisma.motherProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!existing) {
      throw profileNotFound();
    }

    const profile = await this.prisma.motherProfile.update({
      where: { userId },
      data,
      select: PROFILE_SELECT,
    });
    return { profile: this.toView(profile) };
  }

  private toView(profile: SelectedProfile): MotherProfileView {
    return {
      id: profile.id,
      fullName: profile.fullName,
      dateOfBirth: serializeDateOnly(profile.dateOfBirth),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
