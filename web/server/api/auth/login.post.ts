import { setCsrfToken } from '../../utils/csrf';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string };
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig(event);

  const data = await $fetch<LoginResponse>('/auth/login', {
    baseURL: config.apiBase,
    method: 'POST',
    body,
  }).catch((error) => {
    throw createError({
      statusCode: error.response?.status ?? 502,
      statusMessage: error.data?.message ?? 'No se pudo iniciar sesión',
    });
  });

  const cookieOpts = {
    httpOnly: true,
    secure:
      process.env.COOKIE_SECURE === 'true' ||
      (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false'),
    sameSite: 'lax' as const,
    path: '/',
  };

  setCookie(event, 'access_token', data.accessToken, { ...cookieOpts, maxAge: 15 * 60 });
  setCookie(event, 'refresh_token', data.refreshToken, {
    ...cookieOpts,
    maxAge: 7 * 24 * 60 * 60,
  });
  setCsrfToken(event);

  return { user: data.user };
});
