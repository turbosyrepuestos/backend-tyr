import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TokenBlacklist extends Document {
  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 'access' })
  type: string; // 'access' o 'refresh'
}

export const TokenBlacklistSchema =
  SchemaFactory.createForClass(TokenBlacklist);
