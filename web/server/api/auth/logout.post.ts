export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refresh_token');
  const config = useRuntimeConfig(event);

  if (refreshToken) {
    await $fetch('/auth/logout', {
      baseURL: config.apiBase,
      method: 'POST',
      body: { refreshToken },
    }).catch(() => {});
  }

  deleteCookie(event, 'access_token', { path: '/' });
  deleteCookie(event, 'refresh_token', { path: '/' });

  return { success: true };
});
