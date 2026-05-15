import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Otp extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ enum: ['login', 'password_recovery'], default: 'login' })
  type: string;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
