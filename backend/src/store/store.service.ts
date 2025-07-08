import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StoreService {
  constructor(private readonly prismaService: PrismaService) {}

  private mainImageStoragePath = path.join(
    __dirname,
    '..',
    '..',
    'public',
    'images',
    'mainImages',
  );

  private previewImageStoragePath = path.join(
    __dirname,
    '..',
    '..',
    'public',
    'images',
    'previewImages',
  );

  private carouselImagesStoragePath = path.join(
    __dirname,
    '..',
    '..',
    'public',
    'images',
    'carouselImages',
  );

  async getStores() {
    try {
      return await this.prismaService.store.findMany({
        where: { isVisible: true },
        include: {
          categories: true,
          subcategories: true,
          filters: true,
        },
      });
    } catch (err) {
      throw new HttpException(
        'Failed to get stores',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStoreById(id: string) {
    try {
      const store = await this.prismaService.store.findUnique({
        where: { id },
        include: {
          categories: true,
          subcategories: true,
          filters: true,
          products: {
            where: {
              quantity: {
                gt: 0,
              },
            },
          },
        },
      });

      if (!store) {
        throw new HttpException('Store not found', HttpStatus.NOT_FOUND);
      }

      if (!store.isVisible) {
        throw new HttpException('Store not found', HttpStatus.NOT_FOUND);
      }

      return store;
    } catch (err) {
      throw new HttpException(
        'Failed to get store',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStoresByOwner(ownerId: string) {
    try {
      const stores = await this.prismaService.store.findMany({
        where: { ownerId },
        include: {
          categories: true,
          subcategories: true,
          products: true,
          filters: true,
        },
      });

      if (!stores || stores.length === 0) {
        throw new HttpException(
          'No stores found for this owner',
          HttpStatus.NOT_FOUND,
        );
      }

      return stores;
    } catch (err) {
      throw new HttpException(
        'Failed to get stores',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateStore(id: string, updateData: UpdateStoreDto) {
    const { name, description, isVisible } = updateData;

    if (!name && !description && isVisible === undefined) {
      throw new HttpException(
        'No valid data to update',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const updatedStore = await this.prismaService.store.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(isVisible !== undefined && { isVisible }),
        },
      });
      return updatedStore;
    } catch (err) {
      throw new HttpException(
        'Failed to update the store',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateMainImage(storeId: string, file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
    });

    if (store && store.mainImage) {
      this.deleteOldImage(store.mainImage);
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    const filePath = path.join(this.mainImageStoragePath, fileName);

    try {
      fs.mkdirSync(this.mainImageStoragePath, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
    }

    fs.writeFileSync(filePath, file.buffer);

    try {
      await this.prismaService.store.update({
        where: { id: storeId },
        data: { mainImage: `/images/mainImages/${fileName}` },
      });
    } catch (err) {
      throw new HttpException(
        'Failed to update store with image path',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return `/images/mainImages/${fileName}`;
  }

  async updatePreviewImage(storeId: string, file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
    });

    if (store && store.previewImage) {
      this.deleteOldImage(store.previewImage);
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    const filePath = path.join(this.previewImageStoragePath, fileName);

    try {
      fs.mkdirSync(this.previewImageStoragePath, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
    }

    fs.writeFileSync(filePath, file.buffer);
    try {
      await this.prismaService.store.update({
        where: { id: storeId },
        data: { previewImage: `/images/previewImages/${fileName}` },
      });
    } catch (err) {
      throw new HttpException(
        'Failed to update store with preview image path',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return `/images/previewImages/${fileName}`;
  }

  private deleteOldImage(imagePath: string) {
    const fullPath = path.join(__dirname, '..', '..', 'public', imagePath);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.error('Error deleting old image:', err);
    }
  }

  async addCarouselImages(storeId: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
    }

    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
    });

    const uploadedImagePaths = [];

    for (const file of files) {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.carouselImagesStoragePath, fileName);

      try {
        fs.mkdirSync(this.carouselImagesStoragePath, { recursive: true });
      } catch (err) {
        console.error('Error creating directory:', err);
      }

      fs.writeFileSync(filePath, file.buffer);
      uploadedImagePaths.push(`/images/carouselImages/${fileName}`);
    }

    try {
      const updatedStore = await this.prismaService.store.update({
        where: { id: storeId },
        data: {
          carouselImages: {
            push: uploadedImagePaths,
          },
        },
      });
      return uploadedImagePaths;
    } catch (err) {
      throw new HttpException(
        'Failed to add images to carousel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeCarouselImage(storeId: string, imagePath: string) {
    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
    });

    if (!store || !store.carouselImages.includes(imagePath)) {
      throw new HttpException(
        'Image not found in carousel',
        HttpStatus.NOT_FOUND,
      );
    }

    const fullPath = path.join(__dirname, '..', '..', 'public', imagePath);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.error('Error deleting image:', err);
    }

    try {
      const updatedStore = await this.prismaService.store.update({
        where: { id: storeId },
        data: {
          carouselImages: {
            set: store.carouselImages.filter((image) => image !== imagePath),
          },
        },
      });
      return { message: 'Image removed successfully' };
    } catch (err) {
      throw new HttpException(
        'Failed to remove image from carousel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addSubcategoryToStore(storeId: string, subcategoryId: string) {
    try {
      const subcategory = await this.prismaService.subcategory.findUnique({
        where: { id: subcategoryId },
        include: { category: true },
      });

      if (!subcategory) {
        throw new HttpException('Subcategory not found', HttpStatus.NOT_FOUND);
      }

      const categoryId = subcategory.category?.id;
      if (!categoryId) {
        throw new HttpException(
          'Parent category not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const updatedStore = await this.prismaService.store.update({
        where: { id: storeId },
        data: {
          categories: {
            connect: { id: categoryId },
          },
          subcategories: {
            connect: { id: subcategoryId },
          },
        },
        include: {
          categories: true,
          subcategories: true,
        },
      });

      return updatedStore;
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Failed to add subcategory to store',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeSubcategoryFromStore(storeId: string, subcategoryId: string) {
    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
      include: { subcategories: true },
    });

    if (!store) {
      throw new HttpException('Store not found', HttpStatus.NOT_FOUND);
    }

    const subcategoryExists = store.subcategories.some(
      (subcategory) => subcategory.id === subcategoryId,
    );

    if (!subcategoryExists) {
      throw new HttpException(
        'Subcategory not found in this store',
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      await this.prismaService.store.update({
        where: { id: storeId },
        data: {
          subcategories: {
            disconnect: { id: subcategoryId },
          },
        },
      });

      return { message: 'Subcategory removed successfully' };
    } catch (err) {
      throw new HttpException(
        'Failed to remove subcategory from store',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addFiltersToStore(storeId: string, filterIds: string[]) {
    try {
      const store = await this.prismaService.store.findUnique({
        where: { id: storeId },
      });

      if (!store) {
        throw new HttpException('Store not found', HttpStatus.NOT_FOUND);
      }

      const filters = await this.prismaService.filter.findMany({
        where: { id: { in: filterIds } },
      });

      if (filters.length !== filterIds.length) {
        throw new HttpException('Some filters not found', HttpStatus.NOT_FOUND);
      }

      const updatedStore = await this.prismaService.store.update({
        where: { id: storeId },
        data: {
          filters: {
            connect: filterIds.map((id) => ({ id })),
          },
        },
        include: {
          filters: true,
        },
      });

      return updatedStore;
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Failed to add filters to store',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeFilterFromStore(storeId: string, filterId: string) {
    try {
      const store = await this.prismaService.store.findUnique({
        where: { id: storeId },
        include: {
          filters: true,
        },
      });

      if (!store) {
        throw new HttpException('Store not found', HttpStatus.NOT_FOUND);
      }

      const filterExists = store.filters.some(
        (filter) => filter.id === filterId,
      );

      if (!filterExists) {
        throw new HttpException(
          'Filter not found in this store',
          HttpStatus.NOT_FOUND,
        );
      }

      const updatedStore = await this.prismaService.store.update({
        where: { id: storeId },
        data: {
          filters: {
            disconnect: { id: filterId },
          },
        },
        include: {
          filters: true,
        },
      });

      return updatedStore;
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Failed to remove filter from store',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
