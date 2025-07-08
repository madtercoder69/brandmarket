import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  photos: string[];

  @IsNotEmpty()
  attachedFiles: string[];
}
