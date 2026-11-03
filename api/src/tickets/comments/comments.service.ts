import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserRole } from '../../generated/prisma/enums.js';
import type { RequestUser } from '../../auth/decorators/current-user.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: RequestUser, ticketId: string, dto: CreateCommentDto) {
    await this.assertTicketAccessible(user, ticketId);

    return this.prisma.comment.create({
      data: {
        ticketId,
        userId: user.userId,
        body: dto.body,
      },
    });
  }

  async findAll(user: RequestUser, ticketId: string) {
    await this.assertTicketAccessible(user, ticketId);

    return this.prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async assertTicketAccessible(user: RequestUser, ticketId: string): Promise<void> {
    const where =
      user.role === UserRole.CUSTOMER
        ? { id: ticketId, orgId: user.orgId, customerId: user.userId }
        : { id: ticketId, orgId: user.orgId };

    const ticket = await this.prisma.ticket.findFirst({ where });
    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }
  }
}