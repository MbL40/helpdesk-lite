import { IsEnum } from 'class-validator';
import { TicketStatus } from '../../generated/prisma/enums.js';

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
