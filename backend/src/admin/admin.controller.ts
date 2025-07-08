import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { SuperGuard } from 'src/auth/guards/super.guard';
import { AdminService } from './admin.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/users')
  @UseGuards(AuthGuard, AdminGuard)
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('/create-admin')
  @UseGuards(AuthGuard, SuperGuard)
  async createAdmin() {
    return this.adminService.createAdmin();
  }

  @Post('/create-shop')
  @UseGuards(AuthGuard, AdminGuard)
  async createShop() {
    return this.adminService.createShop();
  }

  @Delete('/delete-shop/:storeId')
  @UseGuards(AuthGuard, SuperGuard)
  async deleteShop(@Param('storeId') storeId: string) {
    return this.adminService.deleteShop(storeId);
  }

  @Post('/user-block/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async blockUser(@Param('id') userId: string) {
    return this.adminService.blockUser(userId);
  }

  @Post('/user-unblock/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async unblockUser(@Param('id') id: string) {
    return await this.adminService.unblockUser(id);
  }

  @Post('user-add-balance/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async addBalance(@Param('id') id: string, @Body() data: { amount: number }) {
    return await this.adminService.updateUserBalance(id, data.amount, 'add');
  }

  @Post('user-subtract-balance/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async subtractBalance(@Param('id') id: string, @Body() data: { amount: number }) {
    return await this.adminService.updateUserBalance(id, data.amount, 'subtract');
  }

  @Get('/stores')
  @UseGuards(AuthGuard, AdminGuard)
  async getAllStores() {
    return this.adminService.getAllStores();
  }

  @Get('/chats')
  @UseGuards(AuthGuard, SuperGuard)
  async getAllChats() {
    return this.adminService.getAllChats();
  }
}
