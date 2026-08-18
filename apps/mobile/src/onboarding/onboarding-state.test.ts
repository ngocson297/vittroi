import type { MotherProfile, Pregnancy } from '@/api/onboarding-types';
import { resolveOnboardingState, routeForOnboardingState } from './onboarding-state';

const profile: MotherProfile = {
  id: 'profile-id',
  fullName: 'Nguyễn Thị An',
  dateOfBirth: '1995-08-21',
  createdAt: '2026-08-18T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
};

const pregnancy: Pregnancy = {
  id: 'pregnancy-id',
  dueDate: '2026-10-12',
  status: 'ACTIVE',
  actualBirthDate: null,
  createdAt: '2026-08-18T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
};

describe('onboarding state resolver', () => {
  it('routes an account without a profile to mother onboarding', () => {
    const state = resolveOnboardingState(null);
    expect(state).toEqual({ status: 'needs-profile' });
    expect(routeForOnboardingState(state)).toBe('/(app)/onboarding/mother-profile');
  });

  it('resumes an account with a profile at pregnancy setup', () => {
    const state = resolveOnboardingState(profile, null);
    expect(state).toEqual({ status: 'needs-pregnancy', profile });
    expect(routeForOnboardingState(state)).toBe('/(app)/onboarding/pregnancy');
  });

  it('restores a complete account directly to Pregnancy Home', () => {
    const state = resolveOnboardingState(profile, pregnancy);
    expect(state).toEqual({ status: 'ready', profile, pregnancy });
    expect(routeForOnboardingState(state)).toBe('/(app)');
  });
});
