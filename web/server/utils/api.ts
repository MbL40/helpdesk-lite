import type { H3Event } from 'h3';

export async function apiFetch<T>(
  event: H3Event,
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown } = {},
): Promise<T> {
  const token = getCookie(event, 'access_token');
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' });
  }
  const config = useRuntimeConfig(event);

  return $fetch<T>(path, {
    ...options,
    baseURL: config.apiBase,
    headers: { Authorization: `Bearer ${token}` },
  }).catch((error) => {
    throw createError({
      statusCode: error.response?.status ?? 502,
      statusMessage: error.data?.message ?? 'Error al comunicarse con la API',
      data: error.data,
    });
  });
}