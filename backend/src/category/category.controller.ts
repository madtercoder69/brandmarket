import {
  Controller,
  UseGuards,
  Post,
  Body,
  Delete,
  Param,
  Get,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { SuperGuard } from 'src/auth/guards/super.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getCategories() {
    return this.categoryService.getCategories();
  }

  @UseGuards(AuthGuard, SuperGuard)
  @UsePipes(new ValidationPipe())
  @Post('create')
  async createCategory(@Body() body: CreateCategoryDto) {
    return this.categoryService.createCategory(body.name);
  }

  @UseGuards(AuthGuard, SuperGuard)
  @UsePipes(new ValidationPipe())
  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }

  @UseGuards(AuthGuard, SuperGuard)
  @Post(':categoryId/subcategory')
  async addSubcategoryToCategory(
    @Param('categoryId') categoryId: string,
    @Body() body: { name: string },
  ) {
    return this.categoryService.addSubcategoryToCategory(categoryId, body.name);
  }

  @UseGuards(AuthGuard, SuperGuard)
  @Delete('subcategory/:id')
  async removeSubcategoryFromCategory(@Param('id') id: string) {
    return this.categoryService.removeSubcategoryFromCategory(id);
  }
}
