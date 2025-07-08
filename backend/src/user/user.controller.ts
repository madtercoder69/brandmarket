import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Request } from 'express';
import { RequestUser } from 'src/types/request-user.interface';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: any) {
    return this.userService.getMe(req.user.userId);
  }
}
