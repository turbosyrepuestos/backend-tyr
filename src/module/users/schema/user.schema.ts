import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  lastname: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: {
      countryCode: String,
      phoneNumber: String,
    },
    required: true,
  })
  phone: {
    countryCode: string;
    phoneNumber: string;
  };

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  photoUrl?: string;

  @Prop({ required: true, default: 'user' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  /** UID de Firebase Auth al vincular inicio de sesión con Google */
  @Prop({ unique: true, sparse: true, trim: true })
  firebaseUid?: string;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
