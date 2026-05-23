import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, SortOrder } from 'mongoose';
import { Product } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    imageUrl: string,
  ): Promise<Product> {
    const newProduct = new this.productModel({
      ...createProductDto,
      images: [imageUrl],
    });
    return await newProduct.save();
  }

  async findAll(queryDto: ProductQueryDto) {
    const {
      name,
      sku,
      status,
      q,
      brand,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'price',
      sortOrder = 'asc',
    } = queryDto;
    const query: Record<string, unknown> = {};

    if (name) {
      query['name'] = { $regex: name, $options: 'i' };
    }

    if (sku) {
      query['sku'] = { $regex: sku, $options: 'i' };
    }

    if (status) {
      query['status'] = status.toUpperCase();
    }

    if (category) {
      query['category'] = { $regex: category, $options: 'i' };
    }

    if (brand) {
      query['$or'] = [
        { brand: { $regex: brand, $options: 'i' } },
        { secondBrand: { $in: [new RegExp(brand, 'i')] } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceQuery: Record<string, unknown> = {};
      if (minPrice !== undefined) {
        priceQuery['$gte'] = minPrice;
      }
      if (maxPrice !== undefined) {
        priceQuery['$lte'] = maxPrice;
      }
      query['price'] = priceQuery;
    }

    let finalQuery: QueryFilter<Product> = query;

    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };
      const orConditions: QueryFilter<Product>[] = [
        { name: searchRegex },
        { description: searchRegex },
        { sku: searchRegex },
        { brand: searchRegex },
        { secondBrand: searchRegex },
        { category: searchRegex },
      ];

      if (finalQuery.$or) {
        const existingOr = finalQuery.$or;
        finalQuery = {
          $and: [{ $or: existingOr }, { $or: orConditions }],
        };
      } else {
        finalQuery = {
          ...finalQuery,
          $or: orConditions,
        };
      }
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, SortOrder> = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(finalQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(finalQuery).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findOne({ _id: id }).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async addImage(id: string, imageUrl: string): Promise<Product> {
    const product = await this.productModel
      .findOneAndUpdate(
        { _id: id },
        { $push: { images: imageUrl } },
        { new: true },
      )
      .exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const updatedProduct = await this.productModel
      .findOneAndUpdate({ _id: id }, updateProductDto, { new: true })
      .exec();
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updatedProduct;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.deleteOne({ id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}
