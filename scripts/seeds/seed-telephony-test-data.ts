import { connect, connection, model, Schema, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dispatch-ai';
const SALT_ROUNDS = 10;

// 定义接口
interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  fullPhoneNumber: string;
  receivedAdverts: boolean;
  status: string;
  role: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Service {
  name: string;
  description: string;
  price: number;
  userId: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Company {
  name: string;
  email: string;
  phone: string;
  address: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 创建 Schema
const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: String,
  fullPhoneNumber: String,
  receivedAdverts: { type: Boolean, default: true },
  status: { type: String, default: 'active' },
  role: { type: String, default: 'user' },
  provider: { type: String, default: 'local' }
}, { timestamps: true });

const serviceSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  userId: { type: String, required: true },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

const companySchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  address: String,
  userId: { type: String, required: true }
}, { timestamps: true });

async function seedTelephonyTestData() {
  try {
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // 创建 models
    const UserModel = model('User', userSchema);
    const ServiceModel = model('Service', serviceSchema);
    const CompanyModel = model('Company', companySchema);
    
    // 清除现有数据
    await UserModel.deleteMany({});
    await ServiceModel.deleteMany({});
    await CompanyModel.deleteMany({});
    
    console.log('🧹 Cleared existing data');
    
    // 创建测试用户
    const hashedPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
    const testUser = await UserModel.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: hashedPassword,
      fullPhoneNumber: '+1-555-123-4567',
      receivedAdverts: true,
      status: 'active',
      role: 'user',
      provider: 'local'
    });
    
    console.log('👤 Created test user:', testUser.email);
    
    // 创建公司信息
    const testCompany = await CompanyModel.create({
      name: 'ABC Cleaning Services',
      email: 'info@abccleaning.com',
      phone: '+1-555-987-6543',
      address: '123 Main Street, Sydney NSW 2000',
      userId: testUser._id.toString()
    });
    
    console.log('🏢 Created test company:', testCompany.name);
    
    // 创建服务列表
    const services = [
      {
        name: 'House Cleaning',
        description: 'Professional house cleaning service including dusting, vacuuming, and bathroom cleaning',
        price: 120.00,
        userId: testUser._id.toString(),
        isAvailable: true
      },
      {
        name: 'Garden Maintenance',
        description: 'Complete garden care including mowing, trimming, and plant care',
        price: 80.00,
        userId: testUser._id.toString(),
        isAvailable: true
      },
      {
        name: 'Plumbing Service',
        description: 'Emergency and routine plumbing repairs and maintenance',
        price: 150.00,
        userId: testUser._id.toString(),
        isAvailable: true
      },
      {
        name: 'Carpet Cleaning',
        description: 'Deep carpet cleaning and stain removal service',
        price: 100.00,
        userId: testUser._id.toString(),
        isAvailable: true
      },
      {
        name: 'Window Cleaning',
        description: 'Professional window cleaning for residential and commercial properties',
        price: 90.00,
        userId: testUser._id.toString(),
        isAvailable: true
      }
    ];
    
    const createdServices = await ServiceModel.insertMany(services);
    console.log('🔧 Created services:', createdServices.map(s => s.name));
    
    // 创建 Redis 测试数据（模拟 CallSkeleton）
    console.log('\n📞 Redis Test Data Structure:');
    console.log('CallSkeleton 示例:');
    console.log(JSON.stringify({
      callSid: 'CA' + randomUUID().replace(/-/g, '').substring(0, 32),
      services: createdServices.map(s => ({
        id: s._id.toString(),
        name: s.name,
        price: s.price,
        description: s.description
      })),
      company: {
        id: testCompany._id.toString(),
        name: testCompany.name,
        email: testCompany.email,
        phone: testCompany.phone
      },
      user: {
        service: null,
        serviceBookedTime: null,
        userInfo: {}
      },
      history: [],
      servicebooked: false,
      confirmEmailsent: false,
      createdAt: new Date().toISOString()
    }, null, 2));
    
    console.log('\n🎯 Test Credentials:');
    console.log('Email: john.doe@example.com');
    console.log('Password: Admin123!');
    console.log('Phone: +1-555-123-4567');
    
    console.log('\n📋 Available Services for Testing:');
    createdServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} - $${service.price} - ${service.description}`);
    });
    
    console.log('\n🚀 Telephony Test Data Setup Complete!');
    console.log('You can now test the phone system with this data.');
    
  } catch (error) {
    console.error('❌ Error seeding telephony test data:', error);
  } finally {
    await connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// 如果直接运行此文件
if (require.main === module) {
  seedTelephonyTestData();
}

export { seedTelephonyTestData }; 