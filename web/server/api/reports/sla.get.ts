import { apiFetch } from '~/server/utils/api';

export default defineEventHandler((event) => apiFetch(event, '/reports/sla'));