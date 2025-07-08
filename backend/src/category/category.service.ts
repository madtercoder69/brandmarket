import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCategories() {
    return this.prismaService.category.findMany({
      include: {
        subcategories: true,
      },
    });
  }

  async createCategory(name: string) {
    return this.prismaService.category.create({
      data: {
        name,
      },
    });
  }

  async deleteCategory(categoryId: string) {
    await this.prismaService.subcategory.deleteMany({
      where: {
        categoryId,
      },
    });

    return this.prismaService.category.delete({
      where: {
        id: categoryId,
      },
    });
  }

  async addSubcategoryToCategory(categoryId: string, subcategoryName: string) {
    return this.prismaService.subcategory.create({
      data: {
        name: subcategoryName,
        categoryId,
      },
    });
  }

  async removeSubcategoryFromCategory(subcategoryId: string) {
    return this.prismaService.subcategory.delete({
      where: {
        id: subcategoryId,
      },
    });
  }
}
