import type { TicketStatus } from '../generated/prisma/enums.js';

const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

export function isValidStatusTransition(current: TicketStatus, next: TicketStatus): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next);
}
