import type { UserRole } from '../../generated/prisma/enums.js';

export interface JwtPayload {
  sub: string;
  orgId: string;
  role: UserRole;
}
