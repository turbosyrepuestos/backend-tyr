import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { RegisterDto } from '../../auth/dto/register-auth.dto';
import { UserQueryDto } from '../dto/user-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: RegisterDto): Promise<UserDocument> {
    const newUser = new this.userModel(createUserDto);
    return await newUser.save();
  }

  async findAllPaginated(queryDto: UserQueryDto) {
    const {
      username,
      email,
      role,
      country,
      city,
      isActive,
      q,
      page = 1,
      limit = 10,
    } = queryDto;

    const query: Record<string, unknown> = {};

    if (username) {
      query['username'] = { $regex: username, $options: 'i' };
    }

    if (email) {
      query['email'] = { $regex: email, $options: 'i' };
    }

    if (role) {
      query['role'] = role;
    }

    if (country) {
      query['country'] = { $regex: country, $options: 'i' };
    }

    if (city) {
      query['city'] = { $regex: city, $options: 'i' };
    }

    if (isActive !== undefined) {
      query['isActive'] = isActive;
    }

    if (q) {
      query['$or'] = [
        { username: { $regex: q, $options: 'i' } },
        { lastname: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const finalQuery = query as unknown as QueryFilter<UserDocument>;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel
        .find(finalQuery)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(finalQuery).exec(),
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

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  async findOneByEmailRegister(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  async findOneById(id: string): Promise<UserDocument | null> {
    return await this.userModel.findById(id).exec();
  }

  async findOneByIdPublic(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(id)
      .select('-password -firebaseUid -isActive')
      .exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .select('-password')
      .exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async softDelete(id: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    user.isActive = false;
    await user.save();
    return { message: `Usuario ${id} desactivado correctamente` };
  }

  async restore(id: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    user.isActive = true;
    await user.save();
    return { message: `Usuario ${id} reactivado correctamente` };
  }

  async updatePassword(id: string, password: string): Promise<void> {
    const result = await this.userModel
      .updateOne({ _id: id }, { password })
      .exec();
    if (result.matchedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async findAll(): Promise<UserDocument[]> {
    return await this.userModel.find().exec();
  }

  async findOneByFirebaseUid(
    firebaseUid: string,
  ): Promise<UserDocument | null> {
    return await this.userModel.findOne({ firebaseUid }).exec();
  }

  async linkFirebaseUid(userId: string, firebaseUid: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $set: { firebaseUid } })
      .exec();
  }
}
