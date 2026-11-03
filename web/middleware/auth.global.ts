export default defineNuxtRouteMiddleware(async (to) => {
    if (to.path === '/login') return;
  
    const auth = useAuthStore();
    if (auth.user) return;
  
    const requestFetch = useRequestFetch();
    try {
      const claims = await requestFetch<{ userId: string; orgId: string; role: string }>(
        '/api/auth/me',
      );
      auth.setUser({ id: claims.userId, role: claims.role });
    } catch {
      return navigateTo('/login');
    }
  });