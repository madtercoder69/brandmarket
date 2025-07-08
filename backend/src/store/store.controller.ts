import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { StoreOwnerGuard } from 'src/auth/guards/store-owner.guard';
import { UpdateStoreDto } from './dto/update-store.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('')
  async getStores() {
    return this.storeService.getStores();
  }

  @Get(':id')
  async getStoreById(@Param('id') id: string) {
    return this.storeService.getStoreById(id);
  }

  @Get('owner/:ownerId')
  async getStoresByOwner(@Param('ownerId') ownerId: string) {
    return this.storeService.getStoresByOwner(ownerId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  @UsePipes(new ValidationPipe())
  async updateStore(
    @Param('id') id: string,
    @Body() updateData: UpdateStoreDto,
  ) {
    return this.storeService.updateStore(id, updateData);
  }

  @Patch(':id/main-image')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  @UseInterceptors(FileInterceptor('mainImage'))
  async updateMainImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storeService.updateMainImage(id, file);
  }

  @Patch(':id/preview-image')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  @UseInterceptors(FileInterceptor('previewImage'))
  async updatePreviewImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storeService.updatePreviewImage(id, file);
  }

  @Post(':id/carousel-images')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  @UseInterceptors(FilesInterceptor('carouselImages'))
  async addCarouselImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.storeService.addCarouselImages(id, files);
  }

  @Delete(':id/carousel-image')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  async removeCarouselImage(
    @Param('id') id: string,
    @Body('imagePath') imagePath: string,
  ) {
    return this.storeService.removeCarouselImage(id, imagePath);
  }

  @Post(':id/subcategory/:subcategoryId')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  async addSubcategoryToStore(
    @Param('id') storeId: string,
    @Param('subcategoryId') subcategoryId: string,
  ) {
    return this.storeService.addSubcategoryToStore(storeId, subcategoryId);
  }

  @Delete(':id/subcategory/:subcategoryId')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  async removeSubcategoryFromStore(
    @Param('id') storeId: string,
    @Param('subcategoryId') subcategoryId: string,
  ) {
    return this.storeService.removeSubcategoryFromStore(storeId, subcategoryId);
  }

  @Post(':id/filters')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  async addFiltersToStore(
    @Param('id') storeId: string,
    @Body('filterIds') filterIds: string[],
  ) {
    return this.storeService.addFiltersToStore(storeId, filterIds);
  }

  @Delete(':id/filter/:filterId')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  async removeFilterFromStore(
    @Param('id') storeId: string,
    @Param('filterId') filterId: string,
  ) {
    return this.storeService.removeFilterFromStore(storeId, filterId);
  }
}
