import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';

import { AppModule } from '../src/modules/app.module';
import { User, UserDocument } from '../src/modules/user/schema/user.schema';
import { UserStatus } from '../src/modules/user/enum/userStatus.enum';
import { EUserRole } from '../src/common/constants/user.constant';

describe('Authentication Security Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userModel: any;

  const testUser = {
    email: 'test@example.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User',
    role: EUserRole.user,
    status: UserStatus.active,
    tokenVersion: 1,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    userModel = moduleFixture.get(getModelToken(User.name));

    await app.init();
  });

  beforeEach(async () => {
    // 清理测试数据
    await userModel.deleteMany({ email: testUser.email });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Token Version Control', () => {
    it('should invalidate tokens when tokenVersion changes', async () => {
      // 创建用户
      const user = new userModel(testUser);
      await user.save();

      // 生成有效token
      const validToken = jwtService.sign({
        sub: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
        tokenVersion: user.tokenVersion,
      });

      // 使用有效token访问受保护端点
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // 增加tokenVersion
      await userModel.findByIdAndUpdate(user._id, { $inc: { tokenVersion: 1 } });

      // 使用旧token应该失败
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401);
    });
  });

  describe('User Status Validation', () => {
    it('should reject banned users', async () => {
      // 创建被封禁的用户
      const bannedUser = new userModel({
        ...testUser,
        status: UserStatus.banned,
      });
      await bannedUser.save();

      const token = jwtService.sign({
        sub: bannedUser._id,
        email: bannedUser.email,
        role: bannedUser.role,
        status: bannedUser.status,
        tokenVersion: bannedUser.tokenVersion,
      });

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should reject inactive users', async () => {
      // 创建非活跃用户
      const inactiveUser = new userModel({
        ...testUser,
        status: 'inactive',
      });
      await inactiveUser.save();

      const token = jwtService.sign({
        sub: inactiveUser._id,
        email: inactiveUser.email,
        role: inactiveUser.role,
        status: inactiveUser.status,
        tokenVersion: inactiveUser.tokenVersion,
      });

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin to access admin-only endpoints', async () => {
      const adminUser = new userModel({
        ...testUser,
        role: EUserRole.admin,
      });
      await adminUser.save();

      const token = jwtService.sign({
        sub: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status,
        tokenVersion: adminUser.tokenVersion,
      });

      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should deny regular users access to admin endpoints', async () => {
      const regularUser = new userModel(testUser);
      await regularUser.save();

      const token = jwtService.sign({
        sub: regularUser._id,
        email: regularUser.email,
        role: regularUser.role,
        status: regularUser.status,
        tokenVersion: regularUser.tokenVersion,
      });

      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Token Invalidation on Logout', () => {
    it('should invalidate tokens on logout', async () => {
      const user = new userModel(testUser);
      await user.save();

      const token = jwtService.sign({
        sub: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
        tokenVersion: user.tokenVersion,
      });

      // 登出
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // token应该失效
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
}); 