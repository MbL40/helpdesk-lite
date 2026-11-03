import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';
import { SlaService } from './sla/sla.service.js';
import { CommentsController } from './comments/comments.controller.js';
import { CommentsService } from './comments/comments.service.js';

@Module({
  controllers: [TicketsController, CommentsController],
  providers: [TicketsService, SlaService, CommentsService],
})
export class TicketsModule {}
