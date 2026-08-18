import type { MotherProfile, Pregnancy } from '@/api/onboarding-types';

export type OnboardingState =
  | { status: 'loading' }
  | { status: 'needs-profile' }
  | { status: 'needs-pregnancy'; profile: MotherProfile }
  | { status: 'ready'; profile: MotherProfile; pregnancy: Pregnancy }
  | { status: 'error'; message: string };

export type ResolvedOnboardingState = Exclude<
  OnboardingState,
  { status: 'loading' | 'error' }
>;

export function resolveOnboardingState(
  profile: MotherProfile | null,
  pregnancy: Pregnancy | null = null,
): ResolvedOnboardingState {
  if (!profile) return { status: 'needs-profile' };
  if (!pregnancy) return { status: 'needs-pregnancy', profile };
  return { status: 'ready', profile, pregnancy };
}

export function routeForOnboardingState(
  state: ResolvedOnboardingState,
): '/(app)/onboarding/mother-profile' | '/(app)/onboarding/pregnancy' | '/(app)' {
  switch (state.status) {
    case 'needs-profile':
      return '/(app)/onboarding/mother-profile';
    case 'needs-pregnancy':
      return '/(app)/onboarding/pregnancy';
    case 'ready':
      return '/(app)';
  }
}
