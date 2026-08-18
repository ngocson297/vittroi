import { ApiClient } from './api-client';
import { ApiError } from './api-error';
import { PREGNANCY_ENDPOINTS, PROFILE_ENDPOINTS } from './endpoints';
import type {
  CreateMotherProfileInput,
  CreatePregnancyInput,
  MotherProfile,
  Pregnancy,
  UpdateMotherProfileInput,
} from './onboarding-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isMotherProfile(value: unknown): value is MotherProfile {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.fullName === 'string' &&
    isDateOnly(value.dateOfBirth) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

export function isPregnancy(value: unknown): value is Pregnancy {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    isDateOnly(value.dueDate) &&
    (value.status === 'ACTIVE' || value.status === 'COMPLETED') &&
    (value.actualBirthDate === null || isDateOnly(value.actualBirthDate)) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

export function parseProfileResponse(value: unknown): MotherProfile | null {
  if (!isRecord(value) || !('profile' in value)) {
    throw new ApiError(502, 'API_INVALID_PROFILE_RESPONSE');
  }
  if (value.profile === null) return null;
  if (!isMotherProfile(value.profile)) {
    throw new ApiError(502, 'API_INVALID_PROFILE_RESPONSE');
  }
  return value.profile;
}

export function parsePregnancyResponse(value: unknown): Pregnancy | null {
  if (!isRecord(value) || !('pregnancy' in value)) {
    throw new ApiError(502, 'API_INVALID_PREGNANCY_RESPONSE');
  }
  if (value.pregnancy === null) return null;
  if (!isPregnancy(value.pregnancy)) {
    throw new ApiError(502, 'API_INVALID_PREGNANCY_RESPONSE');
  }
  return value.pregnancy;
}

export function parsePregnanciesResponse(value: unknown): Pregnancy[] {
  if (!isRecord(value) || !Array.isArray(value.pregnancies)) {
    throw new ApiError(502, 'API_INVALID_PREGNANCIES_RESPONSE');
  }
  if (!value.pregnancies.every(isPregnancy)) {
    throw new ApiError(502, 'API_INVALID_PREGNANCIES_RESPONSE');
  }
  return value.pregnancies;
}

function parseCreatedProfile(value: unknown): MotherProfile {
  if (isMotherProfile(value)) return value;
  const profile = parseProfileResponse(value);
  if (!profile) throw new ApiError(502, 'API_INVALID_PROFILE_RESPONSE');
  return profile;
}

function parseCreatedPregnancy(value: unknown): Pregnancy {
  const pregnancy = isPregnancy(value) ? value : parsePregnancyResponse(value);
  if (!pregnancy || pregnancy.status !== 'ACTIVE') {
    throw new ApiError(502, 'API_INVALID_PREGNANCY_RESPONSE');
  }
  return pregnancy;
}

function parseCurrentPregnancyResponse(value: unknown): Pregnancy | null {
  const pregnancy = parsePregnancyResponse(value);
  if (pregnancy && pregnancy.status !== 'ACTIVE') {
    throw new ApiError(502, 'API_INVALID_PREGNANCY_RESPONSE');
  }
  return pregnancy;
}

export class OnboardingApi {
  constructor(private readonly client: ApiClient) {}

  async getMotherProfile(): Promise<MotherProfile | null> {
    return parseProfileResponse(
      await this.client.request(PROFILE_ENDPOINTS.me, { authenticated: true }),
    );
  }

  async createMotherProfile(
    input: CreateMotherProfileInput,
  ): Promise<MotherProfile> {
    return parseCreatedProfile(
      await this.client.request(PROFILE_ENDPOINTS.me, {
        method: 'POST',
        body: { ...input, fullName: input.fullName.trim() },
        authenticated: true,
      }),
    );
  }

  async updateMotherProfile(
    input: UpdateMotherProfileInput,
  ): Promise<MotherProfile> {
    const body = {
      ...input,
      ...(input.fullName === undefined ? {} : { fullName: input.fullName.trim() }),
    };
    return parseCreatedProfile(
      await this.client.request(PROFILE_ENDPOINTS.me, {
        method: 'PATCH',
        body,
        authenticated: true,
      }),
    );
  }

  async getPregnancies(): Promise<Pregnancy[]> {
    return parsePregnanciesResponse(
      await this.client.request(PREGNANCY_ENDPOINTS.list, { authenticated: true }),
    );
  }

  async getCurrentPregnancy(): Promise<Pregnancy | null> {
    return parseCurrentPregnancyResponse(
      await this.client.request(PREGNANCY_ENDPOINTS.current, {
        authenticated: true,
      }),
    );
  }

  async createPregnancy(input: CreatePregnancyInput): Promise<Pregnancy> {
    return parseCreatedPregnancy(
      await this.client.request(PREGNANCY_ENDPOINTS.list, {
        method: 'POST',
        body: input,
        authenticated: true,
      }),
    );
  }
}
