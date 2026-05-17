import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/guard/roles.enum';
import { UploadImageToS3 } from '../s3/decorators/upload-image-to-s3.decorator';
import { S3UploadedUrl } from '../s3/decorators/s3-uploaded-url.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Auth({ roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @UploadImageToS3('image', { folder: 'products', required: true })
  @ApiResponse({ status: 201, description: 'El producto ha sido creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() createProductDto: CreateProductDto, @S3UploadedUrl() imageUrl: string | undefined) {
    if (!imageUrl) {
      throw new BadRequestException('No se pudo obtener la URL de la imagen');
    }
    return this.productsService.create(createProductDto, imageUrl);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de productos.' })
  findAll(@Query() queryDto: ProductQueryDto) {
    return this.productsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por su ID personalizado' })
  @ApiResponse({ status: 200, description: 'Producto encontrado.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id/image')
  @Auth({ roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @UploadImageToS3('image', { folder: 'products', required: true })
  @ApiOperation({
    summary: 'Subir imagen de producto a S3 y guardar URL en BD',
  })
  @ApiResponse({ status: 200, description: 'Producto con nueva imagen.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  uploadImage(
    @Param('id') id: string,
    @S3UploadedUrl() imageUrl: string | undefined,
  ) {
    if (!imageUrl) {
      throw new BadRequestException('No se pudo obtener la URL de la imagen');
    }
    return this.productsService.addImage(id, imageUrl);
  }

  @Patch(':id')
  @Auth({ roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @ApiOperation({ summary: 'Actualizar un producto por su ID' })
  @ApiResponse({ status: 200, description: 'Producto actualizado.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Auth({ roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
  @ApiOperation({ summary: 'Eliminar un producto por su ID' })
  @ApiResponse({ status: 200, description: 'Producto eliminado.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
