import { describe, expect, it } from 'vitest';
import { calculateSlaDueAt, type BusinessHourWindow } from './sla-calculator.js';

const businessHoursByDay = new Map<number, BusinessHourWindow>([
  [1, { startMinutes: 480, endMinutes: 1080 }],
  [2, { startMinutes: 480, endMinutes: 1080 }],
  [3, { startMinutes: 480, endMinutes: 1080 }],
  [4, { startMinutes: 480, endMinutes: 1080 }],
  [5, { startMinutes: 480, endMinutes: 1080 }],
]);
const holidays = new Set(['2026-11-02', '2026-11-16']);

function bogota(y: number, m: number, d: number, h: number, mi: number): Date {
  return new Date(Date.UTC(y, m - 1, d, h + 5, mi));
}

describe('calculateSlaDueAt', () => {
  it('caso 1: CRITICAL dentro de horario, mismo día', () => {
    const result = calculateSlaDueAt({
      createdAt: bogota(2026, 11, 5, 10, 0),
      priority: 'CRITICAL',
      businessHoursByDay,
      holidays,
    });
    expect(result).toEqual(bogota(2026, 11, 5, 14, 0));
  });

  it('caso 2: CRITICAL cruza fin de semana', () => {
    const result = calculateSlaDueAt({
      createdAt: bogota(2026, 11, 6, 16, 0),
      priority: 'CRITICAL',
      businessHoursByDay,
      holidays,
    });
    expect(result).toEqual(bogota(2026, 11, 9, 10, 0));
  });

  it('caso 3: creado fuera de horario (fin de semana) + festivo en medio', () => {
    const result = calculateSlaDueAt({
      createdAt: bogota(2026, 10, 31, 9, 0),
      priority: 'HIGH',
      businessHoursByDay,
      holidays,
    });
    expect(result).toEqual(bogota(2026, 11, 3, 16, 0));
  });

  it('caso 4: el enunciado da 17-nov 13:00; con el festivo del 16-nov la regla da 18-nov 13:00 (ver DECISIONES.md)', () => {
    const result = calculateSlaDueAt({
      createdAt: bogota(2026, 11, 13, 17, 0),
      priority: 'MEDIUM',
      businessHoursByDay,
      holidays,
    });
    expect(result).toEqual(bogota(2026, 11, 18, 13, 0));
  });

  it('caso 5: LOW, creado fuera de horario entre semana, cruza varios días', () => {
    const result = calculateSlaDueAt({
      createdAt: bogota(2026, 11, 4, 18, 30),
      priority: 'LOW',
      businessHoursByDay,
      holidays,
    });
    expect(result).toEqual(bogota(2026, 11, 10, 18, 0));
  });
});
