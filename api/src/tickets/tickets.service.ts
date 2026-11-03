import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditAction, UserRole } from '../generated/prisma/enums.js';
import type { TicketStatus } from '../generated/prisma/enums.js';
import type { RequestUser } from '../auth/decorators/current-user.js';
import { SlaService } from './sla/sla.service.js';
import { isValidStatusTransition } from './ticket-status-machine.js';
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

  async updateStatus(user: RequestUser, ticketId: string, nextStatus: TicketStatus) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, orgId: user.orgId },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }
    if (!isValidStatusTransition(ticket.status, nextStatus)) {
      throw new ConflictException(`No se puede pasar de ${ticket.status} a ${nextStatus}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: { status: nextStatus },
      });
      await tx.auditLog.create({
        data: {
          ticketId,
          userId: user.userId,
          action: AuditAction.STATUS_CHANGED,
          oldValue: ticket.status,
          newValue: nextStatus,
        },
      });
      return updated;
    });
  }
}
