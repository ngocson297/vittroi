import { ApiClient } from './api-client';
import { OnboardingApi, parsePregnancyResponse, parseProfileResponse } from './onboarding-api';

const profile = {
  id: 'profile-id',
  fullName: 'Nguyễn Thị An',
  dateOfBirth: '1995-08-21',
  createdAt: '2026-08-18T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
};

const pregnancy = {
  id: 'pregnancy-id',
  dueDate: '2026-10-12',
  status: 'ACTIVE' as const,
  actualBirthDate: null,
  createdAt: '2026-08-18T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
};

function createApi() {
  const request = jest.fn();
  const client = { request } as unknown as ApiClient;
  return { api: new OnboardingApi(client), request };
}

describe('OnboardingApi', () => {
  it('parses nullable onboarding responses', () => {
    expect(parseProfileResponse({ profile: null })).toBeNull();
    expect(parsePregnancyResponse({ pregnancy: null })).toBeNull();
    expect(parseProfileResponse({ profile })).toEqual(profile);
    expect(parsePregnancyResponse({ pregnancy })).toEqual(pregnancy);
  });

  it('rejects malformed or timezone-bearing date-only responses', () => {
    expect(() => parseProfileResponse({ profile: { ...profile, dateOfBirth: '1995-02-30' } })).toThrow(
      'Đã có lỗi xảy ra',
    );
    expect(() =>
      parsePregnancyResponse({
        pregnancy: { ...pregnancy, dueDate: '2026-10-11T17:00:00.000Z' },
      }),
    ).toThrow('Đã có lỗi xảy ra');
  });

  it('rejects a completed pregnancy from the current-pregnancy contract', async () => {
    const { api, request } = createApi();
    request.mockResolvedValue({
      pregnancy: { ...pregnancy, status: 'COMPLETED' },
    });
    await expect(api.getCurrentPregnancy()).rejects.toMatchObject({
      code: 'API_INVALID_PREGNANCY_RESPONSE',
    });
  });

  it('uses authenticated profile contracts and trims the submitted name', async () => {
    const { api, request } = createApi();
    request.mockResolvedValueOnce({ profile: null }).mockResolvedValueOnce({ profile });

    await expect(api.getMotherProfile()).resolves.toBeNull();
    await expect(
      api.createMotherProfile({ fullName: '  Nguyễn Thị An  ', dateOfBirth: '1995-08-21' }),
    ).resolves.toEqual(profile);

    expect(request).toHaveBeenNthCalledWith(1, '/me/profile', { authenticated: true });
    expect(request).toHaveBeenNthCalledWith(2, '/me/profile', {
      method: 'POST',
      body: { fullName: 'Nguyễn Thị An', dateOfBirth: '1995-08-21' },
      authenticated: true,
    });
  });

  it('uses PATCH for profile updates', async () => {
    const { api, request } = createApi();
    request.mockResolvedValue({ profile });
    await expect(api.updateMotherProfile({ fullName: '  Nguyễn Thị An  ' })).resolves.toEqual(
      profile,
    );
    expect(request).toHaveBeenCalledWith('/me/profile', {
      method: 'PATCH',
      body: { fullName: 'Nguyễn Thị An' },
      authenticated: true,
    });
  });

  it('sends only the due date when creating an authenticated pregnancy', async () => {
    const { api, request } = createApi();
    request
      .mockResolvedValueOnce({ pregnancies: [pregnancy] })
      .mockResolvedValueOnce({ pregnancy: pregnancy })
      .mockResolvedValueOnce({ pregnancy });

    await expect(api.getPregnancies()).resolves.toEqual([pregnancy]);
    await expect(api.getCurrentPregnancy()).resolves.toEqual(pregnancy);
    await expect(api.createPregnancy({ dueDate: '2026-10-12' })).resolves.toEqual(pregnancy);

    expect(request).toHaveBeenLastCalledWith('/me/pregnancies', {
      method: 'POST',
      body: { dueDate: '2026-10-12' },
      authenticated: true,
    });
  });
});
