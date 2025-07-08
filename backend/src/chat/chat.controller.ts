import { Controller, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Delete(':chatId')
  @UseGuards(AuthGuard)
  async deleteChat(@Param('chatId') chatId: string, @Req() req) {
    const userId = req.user.userId;
    const userRole = req.user.role;

    return await this.chatService.deleteChat(chatId, userId, userRole);
  }
}
