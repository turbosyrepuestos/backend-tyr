import { IsString, IsArray, IsOptional, ValidateNested, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SpecDto {
  @ApiProperty({ example: 'COMPRESSOR INDUCER' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: '67mm' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

class CompatibilityDto {
  @ApiProperty({ example: 'Caterpillar C-Series' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Industrial engines C15, C18 (2015-2023)' })
  @IsString()
  @IsNotEmpty()
  desc: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'GTX3584RS GEN II' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'HS-TURBO-856881-5068S' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 2450.00 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ example: 'turbos' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Garrett' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: ['Honeywell', 'HKS'], required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  secondBrand?: string[];

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ example: 'IN STOCK' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({
    example:
      'Precision engineered for high-performance applications. The Gen II compressor aerodynamics increase horsepower range significantly over previous models.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: ['https://example.com/image1.jpg'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ type: [SpecDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecDto)
  specs: SpecDto[];

  @ApiProperty({ type: [CompatibilityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompatibilityDto)
  compatibility: CompatibilityDto[];
}
