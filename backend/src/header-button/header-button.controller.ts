import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { HeaderButtonService } from './header-button.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('header-buttons')
export class HeaderButtonController {
  constructor(private readonly headerButtonService: HeaderButtonService) {}

  @Get()
  async getAllButtons() {
    return this.headerButtonService.getAllButtons();
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async updateButton(
    @Param('id') id: string,
    @Body() data: { name?: string; link?: string; icon?: string }
  ) {
    return this.headerButtonService.updateButton(id, data);
  }
} 