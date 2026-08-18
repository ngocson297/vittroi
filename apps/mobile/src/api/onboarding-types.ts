export interface MotherProfile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

export type PregnancyStatus = 'ACTIVE' | 'COMPLETED';

export interface Pregnancy {
  id: string;
  dueDate: string;
  status: PregnancyStatus;
  actualBirthDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMotherProfileInput {
  fullName: string;
  dateOfBirth: string;
}

export type UpdateMotherProfileInput = Partial<CreateMotherProfileInput>;

export interface CreatePregnancyInput {
  dueDate: string;
}
