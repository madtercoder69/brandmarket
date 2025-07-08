import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatType, Role } from '@prisma/client';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async connectUserToSupport(
    client: Socket,
    userId: string,
    productId: string,
  ) {
    console.log(
      `CONNECTING USER TO SUPPORT USERID: ${userId}, PRODUCTID: ${productId}`,
    );
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          include: {
            owner: true,
          },
        },
      },
    });
    const storeOwnerId = product.store?.owner.id;

    if (userId === storeOwnerId) {
      client.emit('error', 'Unable to start a chat with yourself');
      client.disconnect();
      return;
    }

    const chat = await this.findOrCreateChat(userId, storeOwnerId, productId);

    console.log(chat);

    client.join(chat.id);
    client.data.chatId = chat.id;
    client.data.senderId = userId;
    client.emit('chat_connected', { chatId: chat.id });

    const messages = await this.getChatMessages(chat.id);
    client.emit(
      'chat_history',
      messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        senderId: msg.senderId,
        username: msg.sender.username,
        role: msg.sender.role,
      })),
    );
  }

  async connectSupportToUser(
    client: Socket,
    decodedUserId: string,
    chatId: string,
  ) {
    console.log('CONNECTING SUPPORT TO USER');
    const chat = await this.findChat(chatId);

    if (!chat) {
      client.emit('error', 'Chat not found');
      client.disconnect();
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: decodedUserId,
      },
    });

    const userIds = chat.users.map((user) => user.id);

    if (user.role !== Role.SUPERADMIN) {
      if (!userIds.includes(decodedUserId)) {
        console.log(
          `Access denied for user ${decodedUserId} to chat ${chatId}`,
        );
        client.emit('error', 'Access denied');
        client.disconnect();
        return;
      }
    }

    console.log(`Access granted for user ${decodedUserId} to chat ${chatId}`);
    client.join(chat.id);
    client.data.chatId = chat.id;
    client.data.senderId = decodedUserId;
    client.emit('chat_connected', { chatId: chat.id });

    const messages = await this.getChatMessages(chat.id);
    client.emit(
      'chat_history',
      messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        senderId: msg.senderId,
        username: msg.sender.username,
        role: msg.sender.role,
      })),
    );
  }

  async connectToGeneralChat(client: Socket, userId: string) {
    console.log(`CONNECTING USER ${userId} TO GENERAL CHAT`);

    let chat = await this.prisma.chat.findFirst({
      where: { type: 'GENERAL' },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: { type: 'GENERAL' },
      });
    }

    client.join(chat.id);
    client.data.chatId = chat.id;
    client.data.senderId = userId;
    client.emit('chat_connected', { chatId: chat.id });

    const messages = await this.getChatMessages(chat.id);
    client.emit(
      'chat_history',
      messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        senderId: msg.senderId,
        username: msg.sender.username,
        role: msg.sender.role,
      })),
    );
  }

  async findChat(chatId: string) {
    return await this.prisma.chat.findUnique({
      where: { id: chatId, type: ChatType.SUPPORT },
      include: { users: true },
    });
  }

  async findOrCreateChat(
    userId: string,
    storeOwnerId: string,
    productId: string,
  ) {
    let chat = await this.prisma.chat.findFirst({
      where: {
        type: 'SUPPORT',
        users: {
          every: {
            id: { in: [userId, storeOwnerId] },
          },
        },
        productId,
      },
      include: { users: true, product: true },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          type: 'SUPPORT',
          productId,
          users: {
            connect: [{ id: userId }, { id: storeOwnerId }],
          },
        },
        include: { users: true, product: true },
      });
    }
    return chat;
  }

  async getChatMessages(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      include: {
        sender: { select: { id: true, username: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createMessage(chatId: string, senderId: string, content: string) {
    const message = await this.prisma.message.create({
      data: { chatId, senderId, content },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true, role: true },
    });

    return {
      ...message,
      username: user?.username || 'Unknown',
      role: user?.role || 'user',
    };
  }

  async deleteChat(chatId: string, userId: string, userRole: Role) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { users: true },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (userRole !== Role.SUPERADMIN) {
      const isParticipant = chat.users.some((user) => user.id === userId);

      if (!isParticipant) {
        throw new ForbiddenException('You are not a member of the chat room');
      }

      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (user.role !== Role.STORE_OWNER) {
        throw new ForbiddenException('Deletion is forbidden');
      }
    }

    await this.prisma.message.deleteMany({
      where: { chatId },
    });

    await this.prisma.chat.delete({
      where: { id: chatId },
    });

    return { message: 'Chat has been successfully deleted' };
  }
}
