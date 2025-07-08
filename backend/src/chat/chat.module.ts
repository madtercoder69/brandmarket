import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TokenModule } from 'src/token/token.module';
import { PrismaService } from 'src/prisma.service';
import { ChatGateway } from './chat.gateway';

@Module({
  controllers: [ChatController],
  providers: [ChatService, PrismaService, ChatGateway],
  imports: [TokenModule],
  exports: [ChatService],
})
export class ChatModule {}
