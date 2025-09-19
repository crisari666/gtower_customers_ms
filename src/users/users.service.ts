import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto-js';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly appConfigService: AppConfigService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { username, password } = createUserDto;

    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Use hash key from environment variable for password hashing
    const hashKey = this.appConfigService.hashKey;
    const hashedPassword = crypto.HmacSHA256(password, hashKey).toString();

    const newUser = new this.userModel({
      username,
      password: hashedPassword,
      enabled: true,
    });

    return newUser.save();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    if (updateUserDto.username) {
      const existingUser = await this.userModel.findOne({ 
        username: updateUserDto.username,
        _id: { $ne: id }
      });
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
      updateData.username = updateUserDto.username;
    }

    if (updateUserDto.password) {
      // Use hash key from environment variable for password hashing
      const hashKey = this.appConfigService.hashKey;
      updateData.password = crypto.HmacSHA256(updateUserDto.password, hashKey).toString();
    }

    return this.userModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async disableUser(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userModel.findByIdAndUpdate(id, { enabled: false }, { new: true });
  }

  async enableUser(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userModel.findByIdAndUpdate(id, { enabled: true }, { new: true });
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByUsername(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userModel.findByIdAndDelete(id);
  }
}
