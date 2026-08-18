export interface MotherProfileView {
  id: string;
  fullName: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

export interface MotherProfileResponse {
  profile: MotherProfileView | null;
}
