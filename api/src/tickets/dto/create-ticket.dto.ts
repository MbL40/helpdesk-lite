import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TicketPriority } from '../../generated/prisma/enums.js';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TicketPriority)
  priority: TicketPriority;
}
