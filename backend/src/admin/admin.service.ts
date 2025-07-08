import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ChatType, Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUsers() {
    return await this.prismaService.user.findMany({
      where: {
        role: {
          not: 'SUPERADMIN',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        username: true,
        role: true,
        balance: true,
        createdAt: true,
        store: true,
        isBlocked: true,
      },
    });
  }

  async getAllStores() {
    return await this.prismaService.store.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllChats() {
    return this.prismaService.chat.findMany({
      where: {
        type: ChatType.SUPPORT,
      },
      select: {
        id: true,
        product: {
          select: {
            name: true,
          },
        },
        users: {
          select: {
            username: true,
          },
        },
      },
    });
  }

  async createAdmin() {
    try {
      const username = 'admin' + randomBytes(8).toString('hex');
      const password = this.generateComplexPassword(12);
      const hashedPassword = await argon2.hash(password);
      await this.prismaService.user.create({
        data: {
          username,
          password: hashedPassword,
          role: Role.ADMIN,
        },
      });
      return { username, password };
    } catch (error) {
      console.error('Failed to create an administrator.', error);
      throw new HttpException(
        'Failed to create an administrator.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createShop() {
    try {
      const username = 'shop' + randomBytes(8).toString('hex');
      const password = this.generateComplexPassword(12);
      const hashedPassword = await argon2.hash(password);

      const user = await this.prismaService.user.create({
        data: {
          username,
          password: hashedPassword,
          role: Role.STORE_OWNER,
          store: {
            create: {
              name: ``,
              description: 'Описание магазина',
              mainImage: null,
              previewImage: null,
              carouselImages: [],
            },
          },
        },
        include: { store: true },
      });

      return { username, password, store: user.store };
    } catch (error) {
      console.error('Ошибка при создании магазина:', error);
      throw new HttpException(
        'Failed to create a store.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteShop(storeId: string) {
    try {
      const store = await this.prismaService.store.findUnique({
        where: { id: storeId },
        include: { owner: true, products: { include: { chats: true } } },
      });

      if (!store) {
        throw new HttpException('Магазин не найден', HttpStatus.NOT_FOUND);
      }

      const ownerId = store.ownerId;

      for (const product of store.products) {
        for (const chat of product.chats) {
          await this.prismaService.message.deleteMany({
            where: { chatId: chat.id },
          });
        }
      }

      for (const product of store.products) {
        await this.prismaService.chat.deleteMany({
          where: { productId: product.id },
        });
      }

      await this.prismaService.product.deleteMany({
        where: { storeId: storeId },
      });

      await this.prismaService.store.delete({
        where: { id: storeId },
      });

      if (ownerId) {
        await this.prismaService.message.deleteMany({
          where: { senderId: ownerId },
        });

        await this.prismaService.user.delete({
          where: { id: ownerId },
        });
      }

      return { message: 'магазин, товары, чаты и владельцы успешно удалены' };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Ошибка при удалении магазина',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async blockUser(userId: string): Promise<string> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (user.role === Role.SUPERADMIN) {
        throw new HttpException(
          'Cannot block SUPERADMIN user',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prismaService.user.update({
        where: { id: userId },
        data: { isBlocked: true },
      });

      return `User with ID ${userId} has been blocked.`;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to block user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async unblockUser(userId: string): Promise<string> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (user.role === Role.SUPERADMIN) {
        throw new HttpException(
          'Cannot unblock SUPERADMIN user',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prismaService.user.update({
        where: { id: userId },
        data: { isBlocked: false },
      });

      return `User with ID ${userId} has been unblocked.`;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to unblock user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUserBalance(userId: string, amount: number, operation: 'add' | 'subtract') {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    let updatedBalance;
    
    if (operation === 'add') {
      updatedBalance = await this.prismaService.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: amount,
          },
        },
        select: {
          balance: true,
        },
      });
    } else {
      if (user.balance < amount) {
        throw new Error('Insufficient funds');
      }
      
      updatedBalance = await this.prismaService.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: amount,
          },
        },
        select: {
          balance: true,
        },
      });
    }

    return {
      success: true,
      balance: updatedBalance.balance,
      operation,
      amount,
    };
  }

  private generateComplexPassword(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join('');
  }
}
