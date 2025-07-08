import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class SuperGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

      if (!user) {
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

    return user?.role === Role.SUPERADMIN;
  }
}
