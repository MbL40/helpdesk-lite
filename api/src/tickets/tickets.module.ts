import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';
import { SlaService } from './sla/sla.service.js';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, SlaService],
})
export class TicketsModule {}
