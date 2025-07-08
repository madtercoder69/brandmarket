import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMe(userId: any) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        store: true,
        isBlocked: true,
        chats: {
          include: {
            users: {
              select: {
                username: true,
                role: true,
              },
            },
            product: true,
          },
        },
      },
    });
  }
}
