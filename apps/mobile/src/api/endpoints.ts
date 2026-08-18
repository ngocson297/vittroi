export const AUTH_ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',
} as const;

export const PROFILE_ENDPOINTS = {
  me: '/me/profile',
} as const;

export const PREGNANCY_ENDPOINTS = {
  list: '/me/pregnancies',
  current: '/me/pregnancies/current',
} as const;
