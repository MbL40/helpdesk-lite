import { describe, expect, it } from 'vitest';
import { isValidStatusTransition } from './ticket-status-machine.js';
import { TicketStatus } from '../generated/prisma/enums.js';

const ALL_STATUSES = Object.values(TicketStatus);
const VALID_TRANSITIONS = new Set([
  'OPEN->IN_PROGRESS',
  'IN_PROGRESS->RESOLVED',
  'RESOLVED->CLOSED',
  'RESOLVED->IN_PROGRESS',
]);

describe('isValidStatusTransition', () => {
  for (const current of ALL_STATUSES) {
    for (const next of ALL_STATUSES) {
      const expected = VALID_TRANSITIONS.has(`${current}->${next}`);
      it(`${current} -> ${next} es ${expected ? 'válida' : 'inválida'}`, () => {
        expect(isValidStatusTransition(current, next)).toBe(expected);
      });
    }
  }
});
