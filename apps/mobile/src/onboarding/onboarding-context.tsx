import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { OnboardingApi } from '@/api/onboarding-api';
import { toUserMessage } from '@/api/api-error';
import { useApiClient } from '@/auth/auth-context';
import { resolveOnboardingState, type OnboardingState } from './onboarding-state';

interface OnboardingContextValue {
  state: OnboardingState;
  api: OnboardingApi;
  reload(): Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

async function loadOnboardingState(api: OnboardingApi): Promise<OnboardingState> {
  const profile = await api.getMotherProfile();
  if (!profile) return resolveOnboardingState(null);
  const pregnancy = await api.getCurrentPregnancy();
  return resolveOnboardingState(profile, pregnancy);
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  const client = useApiClient();
  const api = useMemo(() => new OnboardingApi(client), [client]);
  const [state, setState] = useState<OnboardingState>({ status: 'loading' });
  const latestRequest = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setState({ status: 'loading' });

    try {
      const nextState = await loadOnboardingState(api);
      if (requestId !== latestRequest.current) return;
      setState(nextState);
    } catch (error: unknown) {
      if (requestId !== latestRequest.current) return;
      setState({ status: 'error', message: toUserMessage(error) });
    }
  }, [api]);

  useEffect(() => {
    const requestId = ++latestRequest.current;
    void loadOnboardingState(api).then(
      (nextState) => {
        if (requestId === latestRequest.current) setState(nextState);
      },
      (error: unknown) => {
        if (requestId === latestRequest.current) {
          setState({ status: 'error', message: toUserMessage(error) });
        }
      },
    );
    return () => {
      latestRequest.current += 1;
    };
  }, [api]);

  const value = useMemo<OnboardingContextValue>(
    () => ({ state, api, reload }),
    [state, api, reload],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  }
  return context;
}
