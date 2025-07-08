import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class FiltersService {
  constructor(private readonly prismaService: PrismaService) {}

  private filtersStoragePath = path.join(
    __dirname,
    '..',
    '..',
    'public',
    'images',
    'filters',
  );

  async getFilters() {
    return await this.prismaService.filter.findMany();
  }

  async createFilter(file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    const allowedExtensions = ['.gif', '.webp', '.png', '.jpeg', '.jpg'];
    const fileExtension = extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new HttpException(
        'Invalid file type. Only gif, webp, png, jpeg, and jpg are allowed.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.filtersStoragePath, filename);

    if (!fs.existsSync(this.filtersStoragePath)) {
      fs.mkdirSync(this.filtersStoragePath, { recursive: true });
    }

    try {
      fs.writeFileSync(filePath, file.buffer);
    } catch (error) {
      throw new HttpException(
        'Error saving file on server',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const filter = await this.prismaService.filter.create({
        data: {
          imageUrl: path.join('/images', 'filters', filename),
        },
      });
      return filter;
    } catch (error) {
      throw new HttpException(
        'Error saving filter information to database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteFilter(filterId: string) {
    try {
      const filter = await this.prismaService.filter.findUnique({
        where: { id: filterId },
      });

      if (!filter) {
        throw new HttpException('Filter not found', HttpStatus.NOT_FOUND);
      }
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        filter.imageUrl,
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await this.prismaService.filter.delete({
        where: { id: filterId },
      });

      return { message: 'Filter deleted successfully' };
    } catch (error) {
      throw new HttpException(
        'Error deleting filter or file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
