import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class OverviewService {
  constructor(private readonly prismaService: PrismaService) {}

  private overViewImagesPath = path.join(
    __dirname,
    '..',
    '..',
    'public',
    'images',
    'overview',
  );

  async getOverview() {
    const images = await this.prismaService.image.findMany({
      select: {
        id: true,
        createdAt: true,
        imagePath: true,
        paymentUrl: true,
        text: true,
      },
    });

    return images;
  }

  async addOverviewImage(
    files: Express.Multer.File[],
    paymentUrl: string,
    text: string,
  ) {
    if (!files || files.length === 0) {
      throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
    }

    const uploadedImages = [];

    for (const file of files) {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.overViewImagesPath, fileName);

      try {
        fs.mkdirSync(this.overViewImagesPath, { recursive: true });
      } catch (err) {
        console.error('Error creating directory:', err);
      }

      fs.writeFileSync(filePath, file.buffer);

      uploadedImages.push({
        imagePath: `/images/overview/${fileName}`,
        paymentUrl,
        text,
      });
    }

    const overview = await this.prismaService.overview.findFirst();

    if (overview) {
      try {
        for (const image of uploadedImages) {
          await this.prismaService.image.create({
            data: {
              imagePath: image.imagePath,
              paymentUrl: image.paymentUrl,
              text: image.text,
              overviewId: overview.id,
            },
          });
        }
      } catch (err) {
        console.error('Error adding images to database:', err);
        throw new HttpException(
          'Failed to add images to the database',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      const newOverview = await this.prismaService.overview.create({
        data: {},
      });

      for (const image of uploadedImages) {
        await this.prismaService.image.create({
          data: {
            imagePath: image.imagePath,
            paymentUrl: image.paymentUrl,
            text: image.text,
            overviewId: newOverview.id,
          },
        });
      }
    }

    return uploadedImages;
  }

  async deleteOverviewImage(imageId: string) {
    const image = await this.prismaService.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    }

    const imagePath = path.join(
      this.overViewImagesPath,
      path.basename(image.imagePath),
    );
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    try {
      await this.prismaService.image.delete({
        where: { id: image.id },
      });
      return { message: 'Image deleted successfully' };
    } catch (err) {
      console.error('Error deleting image from database:', err);
      throw new HttpException(
        'Failed to delete image from database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
