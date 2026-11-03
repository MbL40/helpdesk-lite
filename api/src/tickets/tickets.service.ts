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

  async findOne(user: RequestUser, ticketId: string) {
    return this.findAccessibleTicket(user, ticketId);
  }

  async findAuditLog(user: RequestUser, ticketId: string) {
    await this.findAccessibleTicket(user, ticketId);
    return this.prisma.auditLog.findMany({
      where: { ticketId },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(user: RequestUser, ticketId: string, nextStatus: TicketStatus) {
    const ticket = await this.findAccessibleTicket(user, ticketId);
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

  async assign(user: RequestUser, ticketId: string) {
    await this.findAccessibleTicket(user, ticketId);

    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.ticket.updateMany({
        where: { id: ticketId, agentId: null },
        data: { agentId: user.userId },
      });
      if (count === 0) {
        throw new ConflictException('Este ticket ya fue asignado');
      }

      await tx.auditLog.create({
        data: {
          ticketId,
          userId: user.userId,
          action: AuditAction.AGENT_ASSIGNED,
          oldValue: null,
          newValue: user.userId,
        },
      });

      return tx.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    });
  }

  private async findAccessibleTicket(user: RequestUser, ticketId: string) {
    const where =
      user.role === UserRole.CUSTOMER
        ? { id: ticketId, orgId: user.orgId, customerId: user.userId }
        : { id: ticketId, orgId: user.orgId };

    const ticket = await this.prisma.ticket.findFirst({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }
    return ticket;
  }
}
