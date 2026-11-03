import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole } from '../generated/prisma/enums.js';
import type { RequestUser } from '../auth/decorators/current-user.js';
import { SlaService } from './sla/sla.service.js';
import type { CreateTicketDto } from './dto/create-ticket.dto.js';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sla: SlaService,
  ) {}

  async create(user: RequestUser, dto: CreateTicketDto) {
    const createdAt = new Date();
    const slaDueAt = await this.sla.calculateDueAt(createdAt, dto.priority);

    return this.prisma.ticket.create({
      data: {
        orgId: user.orgId,
        customerId: user.userId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        createdAt,
        slaDueAt,
      },
    });
  }

  findAllForUser(user: RequestUser) {
    const where =
      user.role === UserRole.CUSTOMER
        ? { orgId: user.orgId, customerId: user.userId }
        : { orgId: user.orgId };

    return this.prisma.ticket.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
}
