import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.js';
import { RolesGuard } from '../auth/guards/roles.js';
import { Roles } from '../auth/decorators/roles.js';
import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.js';
import { UserRole } from '../generated/prisma/enums.js';
import { ReportsService } from './reports.service.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(UserRole.ADMIN)
  @Get('sla')
  getSlaReport(@CurrentUser() user: RequestUser) {
    return this.reportsService.getSlaReport(user.orgId);
  }
}
