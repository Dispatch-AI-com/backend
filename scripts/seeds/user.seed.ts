import { INestApplicationContext } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../src/modules/user/schema/user.schema';
import { EUserRole } from '../../src/common/constants/user.constant';
import { UserStatus } from '../../src/modules/user/enum/userStatus.enum';
import * as bcrypt from 'bcryptjs';

const mockUsers = [
  {
    firstName: 'John',
    lastName: 'Admin',
    email: 'john.admin@example.com',
    password: bcrypt.hashSync('Admin123!', 10),
    fullPhoneNumber: '+61400001234',
    role: EUserRole.admin,
    status: UserStatus.active,
    receivedAdverts: true,
  },
  {
    firstName: 'Jane',
    lastName: 'User',
    email: 'jane.user@example.com',
    password: bcrypt.hashSync('User123!', 10),
    fullPhoneNumber: '+61400005678',
    role: EUserRole.user,
    status: UserStatus.active,
    receivedAdverts: true,
  },
  {
    firstName: 'Bob',
    lastName: 'User',
    email: 'bob.user@example.com',
    password: bcrypt.hashSync('User123!', 10),
    fullPhoneNumber: '+61400009012',
    role: EUserRole.user,
    status: UserStatus.active,
    receivedAdverts: false,
  },
];

export async function seedUsers(app: INestApplicationContext) {
  const userModel = app.get<Model<UserDocument>>('UserModel');
  
  console.log('👥 Seeding users...');
  
  for (const user of mockUsers) {
    try {
      await userModel.create(user);
      console.log(`✅ Created user ${user.firstName} ${user.lastName}`);
    } catch (error) {
      console.error(`❌ Failed to create user ${user.firstName} ${user.lastName}:`, error);
    }
  }
  
  console.log('✅ Users seeding completed');
} 