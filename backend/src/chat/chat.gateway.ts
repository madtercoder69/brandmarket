import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { TokenService } from 'src/token/token.service';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly tokenService: TokenService,
  ) {}

  async handleConnection(client: Socket) {
    const { productId, chatId } = client.handshake.query;
    const token = client.handshake.headers['authorization']?.split(' ')[1];

    if (!token) {
      client.emit('error', 'Token is missing');
      client.disconnect();
      return;
    }

    try {
      const decodedToken = await this.tokenService.verifyAccessToken(token);

      if (!decodedToken) {
        client.emit('error', 'Invalid token');
        client.disconnect();
        return;
      }

      const { userId: decodedUserId } = decodedToken;

      const productIdStr = Array.isArray(productId) ? productId[0] : productId;
      const chatIdStr = Array.isArray(chatId) ? chatId[0] : chatId;

      if (productIdStr) {
        await this.chatService.connectUserToSupport(
          client,
          decodedUserId,
          productIdStr,
        );
      } else if (chatIdStr) {
        await this.chatService.connectSupportToUser(
          client,
          decodedUserId,
          chatIdStr,
        );
      } else {
        await this.chatService.connectToGeneralChat(client, decodedUserId);
      }
    } catch (err) {
      client.emit('error', 'Invalid or expired token');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Received send_message event');
    const { chatId, senderId } = client.data;

    const message = await this.chatService.createMessage(
      chatId,
      senderId,
      data,
    );

    this.server.to(chatId).emit('new_message', message);
  }
}
