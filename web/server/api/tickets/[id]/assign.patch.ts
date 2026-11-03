import { apiFetch } from '~/server/utils/api';

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id');
  return apiFetch(event, `/tickets/${id}/assign`, { method: 'PATCH' });
});
