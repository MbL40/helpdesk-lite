import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.js';
import { RolesGuard } from '../../auth/guards/roles.js';
import { CurrentUser, type RequestUser } from '../../auth/decorators/current-user.js';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets/:ticketId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user, ticketId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser, @Param('ticketId') ticketId: string) {
    return this.commentsService.findAll(user, ticketId);
  }
}