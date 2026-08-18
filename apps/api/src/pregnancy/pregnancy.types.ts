import type { PregnancyStatus } from '../generated/prisma/client';

export interface PregnancyView {
  id: string;
  dueDate: string;
  status: PregnancyStatus;
  actualBirthDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PregnancyResponse {
  pregnancy: PregnancyView | null;
}

export interface PregnanciesResponse {
  pregnancies: PregnancyView[];
}
