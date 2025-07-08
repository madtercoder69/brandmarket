import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class StoreOwnerGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (user.role === Role.SUPERADMIN || user.role === Role.ADMIN) {
      return true;
    }

    const store = await this.prismaService.store.findUnique({
      where: { ownerId: user.userId },
    });

    if (!store) {
      throw new HttpException('Store not found', HttpStatus.NOT_FOUND);
    }

    if (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      return true;
    }

    if (store.ownerId === user.userId) {
      return true;
    }

    throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
  }
}
