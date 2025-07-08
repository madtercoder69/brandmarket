import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FiltersService } from './filters.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { SuperGuard } from 'src/auth/guards/super.guard';

@Controller('filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Get('')
  async getFilters() {
    return this.filtersService.getFilters();
  }

  @Post('create')
  @UseGuards(AuthGuard, SuperGuard)
  @UseInterceptors(FileInterceptor('filterImage'))
  async createFilter(@UploadedFile() file: Express.Multer.File) {
    return this.filtersService.createFilter(file);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, SuperGuard)
  async deleteFilter(@Param('id') filterId: string) {
    return await this.filtersService.deleteFilter(filterId);
  }
}
