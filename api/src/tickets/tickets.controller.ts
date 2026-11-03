import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.js';
import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.js';
import { UserRole } from '../generated/prisma/enums.js';
import { TicketsService } from './tickets.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto.js';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Roles(UserRole.CUSTOMER)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.ticketsService.findAllForUser(user);
  }

  @Roles(UserRole.AGENT)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.updateStatus(user, id, dto.status);
  }

  @Roles(UserRole.AGENT)
  @Patch(':id/assign')
  assign(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ticketsService.assign(user, id);
  }
}
