import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async createProduct(storeId: string, productData: CreateProductDto) {
    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new HttpException('Store not found', HttpStatus.NOT_FOUND);
    }

    try {
      const newProduct = await this.prismaService.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          type: productData.type,
          storeId: storeId,
          quantity: productData.quantity,
          photos: productData.photos || [],
          comment: productData.comment,
          attachedFiles: productData.attachedFiles || [],
        },
      });
      return newProduct;
    } catch (err) {
      throw new HttpException(
        'Failed to create product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteProduct(productId: string) {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
      include: { chats: true, payments: true },
    });

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    // Check if the product has any completed payments
    const hasCompletedPayments = product.payments.some(payment => payment.status === 'COMPLETED');
    
    if (hasCompletedPayments) {
      throw new HttpException(
        'Cannot delete product that has been purchased',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      await this.prismaService.message.deleteMany({
        where: { chatId: { in: product.chats.map((chat) => chat.id) } },
      });

      await this.prismaService.chat.deleteMany({
        where: { id: { in: product.chats.map((chat) => chat.id) } },
      });

      await this.prismaService.product.delete({
        where: { id: productId },
      });

      return {
        message: 'Product and related chats/messages successfully deleted',
      };
    } catch (err) {
      throw new HttpException(
        'Failed to delete product and related data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateProduct(productId: string, updateData: UpdateProductDto) {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
      include: { chats: { include: { messages: true } } },
    });

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    if (updateData.quantity <= 0) {
      for (const chat of product.chats) {
        await this.prismaService.message.deleteMany({
          where: { chatId: chat.id },
        });

        await this.prismaService.chat.delete({
          where: { id: chat.id },
        });
      }
    }

    try {
      const updatedProduct = await this.prismaService.product.update({
        where: { id: productId },
        data: updateData,
      });

      return updatedProduct;
    } catch (err) {
      throw new HttpException(
        'Failed to update product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductsByOwner(ownerId: string) {
    const store = await this.prismaService.store.findUnique({
      where: { ownerId: ownerId },
    });

    if (!store) {
      throw new HttpException(
        'Store not found for this owner',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prismaService.product.findMany({
      where: { storeId: store.id },
    });
  }

  async getProductById(productId: string) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { id: productId },
        include: { store: true },
      });

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      return product;
    } catch (error) {
      throw new HttpException(
        'Failed to get product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
