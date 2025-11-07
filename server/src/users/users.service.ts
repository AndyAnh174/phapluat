import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOrCreate(googleId: string, email: string, name: string) {
    let user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      user = await this.userModel.create({
        email,
        name,
        googleId,
        role: UserRole.STUDENT,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    return user;
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }
}

