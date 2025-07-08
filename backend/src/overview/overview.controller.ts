import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OverviewService } from './overview.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SuperGuard } from 'src/auth/guards/super.guard';

@Controller('overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('')
  async getOverview() {
    return this.overviewService.getOverview();
  }

  @Post('')
  @UseGuards(AuthGuard, SuperGuard)
  @UseInterceptors(FilesInterceptor('overview'))
  async addOverviewImage(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('paymentUrl') paymentUrl: string,
    @Body('text') text: string,
  ) {
    return this.overviewService.addOverviewImage(files, paymentUrl, text);
  }

  @Delete('')
  @UseGuards(AuthGuard, SuperGuard)
  async deleteOverviewImage(@Body('imageId') imageId: string) {
    return this.overviewService.deleteOverviewImage(imageId);
  }
}
