export default defineEventHandler((event) => {
  const token = getCookie(event, 'access_token');
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' });
  }

  const payload = decodeJwtPayload(token);
  return { userId: payload.sub, orgId: payload.orgId, role: payload.role };
});
