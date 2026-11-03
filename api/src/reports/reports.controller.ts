import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.js';
import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.js';
import { UserRole } from '../generated/prisma/enums.js';
import { ReportsService } from './reports.service.js';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(UserRole.ADMIN)
  @Get('sla')
  getSlaReport(@CurrentUser() user: RequestUser) {
    return this.reportsService.getSlaReport(user.orgId);
  }
}
