import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { TicketPriority } from '../../generated/prisma/enums.js';
import { calculateSlaDueAt, type BusinessHourWindow } from './sla-calculator.js';

@Injectable()
export class SlaService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateDueAt(createdAt: Date, priority: TicketPriority): Promise<Date> {
    const [holidays, businessHours] = await Promise.all([
      this.prisma.holiday.findMany(),
      this.prisma.businessHour.findMany(),
    ]);

    return calculateSlaDueAt({
      createdAt,
      priority,
      holidays: new Set(holidays.map((h) => h.dateDay.toISOString().slice(0, 10))),
      businessHoursByDay: new Map(
        businessHours.map((bh): [number, BusinessHourWindow] => [
          bh.dayOfWeek,
          {
            startMinutes: bh.startTime.getUTCHours() * 60 + bh.startTime.getUTCMinutes(),
            endMinutes: bh.endTime.getUTCHours() * 60 + bh.endTime.getUTCMinutes(),
          },
        ]),
      ),
    });
  }
}
