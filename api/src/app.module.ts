import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.js';
import { RolesGuard } from './auth/guards/roles.js';

@Module({
  imports: [PrismaModule, AuthModule, TicketsModule, ReportsModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
