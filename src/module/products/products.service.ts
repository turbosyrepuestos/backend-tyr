import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = new this.productModel(createProductDto);
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
    const query: any = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    if (sku) {
      query.sku = { $regex: sku, $options: 'i' };
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (brand) {
      query.$or = [
        { brand: { $regex: brand, $options: 'i' } },
        { secondBrand: { $in: [new RegExp(brand, 'i')] } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        query.price.$lte = maxPrice;
      }
    }

    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };
      const orConditions = [
        { name: searchRegex },
        { description: searchRegex },
        { sku: searchRegex },
        { brand: searchRegex },
        { secondBrand: searchRegex },
        { category: searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: orConditions }];
        delete query.$or;
      } else {
        query.$or = orConditions;
      }
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const [data, total] = await Promise.all([
      this.productModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.productModel.countDocuments(query).exec(),
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

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
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
