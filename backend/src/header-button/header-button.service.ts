import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class HeaderButtonService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllButtons() {
    return this.prismaService.headerButton.findMany({
      orderBy: { createdAt: 'asc' }
    });
  }

  async updateButton(id: string, data: { name?: string; link?: string; icon?: string }) {
    return this.prismaService.headerButton.update({
      where: { id },
      data
    });
  }

  async initializeDefaultButtons() {
    const existingButtons = await this.prismaService.headerButton.count();
    
    if (existingButtons === 0) {
      await this.prismaService.headerButton.createMany({
        data: [
          {
            name: 'casino',
            link: '/casino',
            icon: '/web-images/casino-icon.svg'
          },
          {
            name: 'bs',
            link: '/bs',
            icon: '/web-images/bs-icon.svg'
          },
          {
            name: 'chat',
            link: '/chat',
            icon: '/web-images/chat-icon.svg'
          }
        ]
      });
    }
  }
} 