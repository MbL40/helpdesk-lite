import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '../../generated/prisma/enums.js';

export interface RequestUser {
  userId: string;
  orgId: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
