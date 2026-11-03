import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { RequestUser } from '../../auth/decorators/current-user.js';
import { TicketsService } from '../tickets.service.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsService: TicketsService,
  ) {}

  async create(user: RequestUser, ticketId: string, dto: CreateCommentDto) {
    await this.ticketsService.findOne(user, ticketId);

    return this.prisma.comment.create({
      data: {
        ticketId,
        userId: user.userId,
        body: dto.body,
      },
    });
  }

  async findAll(user: RequestUser, ticketId: string) {
    await this.ticketsService.findOne(user, ticketId);

    return this.prisma.comment.findMany({
      where: { ticketId },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
