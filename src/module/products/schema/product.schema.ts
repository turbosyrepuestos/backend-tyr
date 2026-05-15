import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Product extends Document {
 @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  brand: string;

  @Prop([String])
  secondBrand: string[];

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  description: string;

  @Prop([String])
  images: string[];

  @Prop([{ label: String, value: String }])
  specs: { label: string; value: string }[];

  @Prop([{ title: String, desc: String }])
  compatibility: { title: string; desc: string }[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
