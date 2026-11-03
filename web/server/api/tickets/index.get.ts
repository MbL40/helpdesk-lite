import { apiFetch } from '~/server/utils/api';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  return apiFetch(event, '/tickets', { query });
});