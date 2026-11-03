import type { TicketPriority } from '../../generated/prisma/enums.js';

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

export const SLA_MINUTES_BY_PRIORITY: Record<TicketPriority, number> = {
  CRITICAL: 4 * 60,
  HIGH: 8 * 60,
  MEDIUM: 16 * 60,
  LOW: 40 * 60,
};

export interface BusinessHourWindow {
  startMinutes: number;
  endMinutes: number;
}

export interface SlaCalculationInput {
  createdAt: Date;
  priority: TicketPriority;
  businessHoursByDay: Map<number, BusinessHourWindow>;
  holidays: Set<string>;
}

function toBogota(date: Date): Date {
  return new Date(date.getTime() - BOGOTA_OFFSET_MS);
}

function fromBogota(bogotaWallClock: Date): Date {
  return new Date(bogotaWallClock.getTime() + BOGOTA_OFFSET_MS);
}

function dateKey(bogotaWallClock: Date): string {
  return bogotaWallClock.toISOString().slice(0, 10);
}

function atMinutesOfDay(bogotaDate: Date, minutes: number): Date {
  const result = new Date(bogotaDate);
  result.setUTCHours(0, 0, 0, 0);
  result.setUTCMinutes(minutes);
  return result;
}

function startOfNextDay(bogotaWallClock: Date): Date {
  const result = new Date(bogotaWallClock);
  result.setUTCHours(0, 0, 0, 0);
  result.setUTCDate(result.getUTCDate() + 1);
  return result;
}

function windowFor(
  bogotaDate: Date,
  businessHoursByDay: Map<number, BusinessHourWindow>,
  holidays: Set<string>,
): BusinessHourWindow | null {
  if (holidays.has(dateKey(bogotaDate))) return null;
  return businessHoursByDay.get(bogotaDate.getUTCDay()) ?? null;
}

function nextBusinessOpening(
  bogotaWallClock: Date,
  businessHoursByDay: Map<number, BusinessHourWindow>,
  holidays: Set<string>,
): Date {
  let candidate = bogotaWallClock;
  for (let i = 0; i < 365; i += 1) {
    const window = windowFor(candidate, businessHoursByDay, holidays);
    if (window) {
      const windowStart = atMinutesOfDay(candidate, window.startMinutes);
      if (candidate <= windowStart) return windowStart;
      const windowEnd = atMinutesOfDay(candidate, window.endMinutes);
      if (candidate < windowEnd) return candidate;
    }
    candidate = startOfNextDay(candidate);
  }
  throw new Error('No se encontró un día hábil en el siguiente año');
}

export function calculateSlaDueAt(input: SlaCalculationInput): Date {
  const { priority, businessHoursByDay, holidays } = input;
  let remainingMinutes = SLA_MINUTES_BY_PRIORITY[priority];
  let cursor = nextBusinessOpening(toBogota(input.createdAt), businessHoursByDay, holidays);

  while (remainingMinutes > 0) {
    const window = windowFor(cursor, businessHoursByDay, holidays);
    if (!window) {
      cursor = nextBusinessOpening(startOfNextDay(cursor), businessHoursByDay, holidays);
      continue;
    }
    const windowEnd = atMinutesOfDay(cursor, window.endMinutes);
    const availableMinutes = Math.round((windowEnd.getTime() - cursor.getTime()) / 60_000);

    if (remainingMinutes <= availableMinutes) {
      cursor = new Date(cursor.getTime() + remainingMinutes * 60_000);
      remainingMinutes = 0;
    } else {
      remainingMinutes -= availableMinutes;
      cursor = nextBusinessOpening(startOfNextDay(cursor), businessHoursByDay, holidays);
    }
  }

  return fromBogota(cursor);
}
