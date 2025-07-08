import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { StoreOwnerGuard } from 'src/auth/guards/store-owner.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post(':id')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  @UsePipes(new ValidationPipe())
  async createProduct(
    @Param('id') storeId: string,
    @Body() productData: CreateProductDto,
  ) {
    return this.productService.createProduct(storeId, productData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  async deleteProduct(@Param('id') productId: string) {
    return this.productService.deleteProduct(productId);
  }

  @Get('owner/:id')
  async getProductsByOwner(@Param('id') ownerId: string) {
    return this.productService.getProductsByOwner(ownerId);
  }

  @Get(':id')
  async getProductById(@Param('id') productId: string) {
    return this.productService.getProductById(productId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateProduct(
    @Param('id') productId: string,
    @Body() updateData: UpdateProductDto,
  ) {
    return this.productService.updateProduct(productId, updateData);
  }

  @Post('upload-files/:storeId')
  @UseGuards(AuthGuard, StoreOwnerGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadProductFiles(
    @Param('storeId') storeId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
    }

    const uploadedFilePaths = [];
    const path = require('path');
    const fs = require('fs');
    const { v4: uuidv4 } = require('uuid');

    const productFilesStoragePath = path.join(
      __dirname, '..', '..', 'public', 'files', 'products'
    );

    try {
      fs.mkdirSync(productFilesStoragePath, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
    }

    for (const file of files) {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(productFilesStoragePath, fileName);
      
      fs.writeFileSync(filePath, file.buffer);
      uploadedFilePaths.push(fileName);
    }

    return { filePaths: uploadedFilePaths };
  }

  @Get('download/:filename')
  downloadFile(@Param('filename') filename: string, @Res() res) {
    const path = require('path');
    const fs = require('fs');
    
    // Use the same structure as other files in the project
    const filePath = path.join(__dirname, '..', '..', 'public', 'files', 'products', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
