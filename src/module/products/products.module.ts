import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './schema/product.schema';
import { AuthModule } from '../auth/auth.module';
import { S3Module } from '../s3/s3.module';
import { UserRoleGuard } from 'src/common/guard/role.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    AuthModule,
    S3Module,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, UserRoleGuard],
  exports: [ProductsService],
})
export class ProductsModule {}
