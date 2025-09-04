import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../../src/modules/app.module';
import { DatabaseTestHelper } from '../../helpers/database.helper';
import { TEST_USER } from '../../setup';

describe('SettingController (integration)', () => {
  let app: INestApplication;
  let dbHelper: DatabaseTestHelper;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    dbHelper = new DatabaseTestHelper(moduleFixture);

    // Create a test user and company
    const user = await dbHelper.createUser({
      _id: TEST_USER._id,
      email: TEST_USER.email,
      firstName: 'Test',
      lastName: 'User',
      fullPhoneNumber: '+61123456789',
      position: 'Manager',
    });
    userId = (user._id as string | number).toString();

    await dbHelper.createCompany({ user: userId });
  });

  afterAll(async () => {
    await dbHelper.cleanupAll();
    await app.close();
  });

  describe('GET /settings/user/:userId/profile', () => {
    it('should return user profile settings', async () => {
      const res = await request(app.getHttpServer())
        .get(`/settings/user/${userId}/profile`)
        .expect(200);

      expect(res.body).toMatchObject({
        name: 'Test User',
        contact: '+61123456789',
        role: 'Manager',
      });
    });
  });

  describe('PUT /settings/user/:userId/profile', () => {
    it('should update user profile settings', async () => {
      const updateDto = {
        name: 'Updated Name',
        contact: '+61111111111',
        role: 'Admin',
      };
      await request(app.getHttpServer())
        .put(`/settings/user/${userId}/profile`)
        .send(updateDto)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/settings/user/${userId}/profile`)
        .expect(200);

      expect(res.body).toMatchObject(updateDto);
    });
  });

  describe('GET /settings/user/:userId/company', () => {
    it('should return company info', async () => {
      const res = await request(app.getHttpServer())
        .get(`/settings/user/${userId}/company`)
        .expect(200);

      expect(res.body).toHaveProperty('companyName');
      expect(res.body).toHaveProperty('abn');
    });
  });

  describe('PUT /settings/user/:userId/company', () => {
    it('should update company info', async () => {
      const updateDto = {
        companyName: 'New Company Name',
        abn: '51824753556',
      };
      await request(app.getHttpServer())
        .put(`/settings/user/${userId}/company`)
        .send(updateDto)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/settings/user/${userId}/company`)
        .expect(200);

      expect(res.body).toMatchObject(updateDto);
    });
  });

  describe('GET /settings/user/:userId/billing', () => {
    it('should return billing address', async () => {
      const res = await request(app.getHttpServer())
        .get(`/settings/user/${userId}/billing`)
        .expect(200);

      expect(res.body).toHaveProperty('streetAddress');
      expect(res.body).toHaveProperty('suburb');
      expect(res.body).toHaveProperty('state');
      expect(res.body).toHaveProperty('postcode');
    });
  });

  describe('PUT /settings/user/:userId/billing', () => {
    it('should update billing address', async () => {
      const updateDto = {
        unit: 'Unit 1',
        streetAddress: '456 New St',
        suburb: 'Newville',
        state: 'NSW',
        postcode: '2000',
      };
      await request(app.getHttpServer())
        .put(`/settings/user/${userId}/billing`)
        .send(updateDto)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/settings/user/${userId}/billing`)
        .expect(200);

      expect(res.body).toMatchObject(updateDto);
    });
  });

  describe('GET /settings/user/:userId/all', () => {
    it('should return all user settings', async () => {
      const res = await request(app.getHttpServer())
        .get(`/settings/user/${userId}/all`)
        .expect(200);

      expect(res.body).toHaveProperty('userProfile');
      expect(res.body).toHaveProperty('companyInfo');
      expect(res.body).toHaveProperty('billingAddress');
    });
  });

  describe('DELETE /settings/user/:userId/category/:category', () => {
    it('should delete user profile settings (noop, fields remain unchanged)', async () => {
      // Reset user profile to a known state before delete
      const resetProfile = {
        name: 'Reset Name',
        contact: '+61100000000',
        role: 'ResetRole',
      };
      await request(app.getHttpServer())
        .put(`/settings/user/${userId}/profile`)
        .send(resetProfile)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/settings/user/${userId}/category/USER_PROFILE`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .get(`/settings/user/${userId}/profile`)
        .expect(200);

      // Expect the profile to remain unchanged
      expect(res.body).toMatchObject(resetProfile);
  });
});

  describe('DELETE /settings/user/:userId/all', () => {
    it('should delete all user settings', async () => {
      await request(app.getHttpServer())
        .delete(`/settings/user/${userId}/all`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .get(`/settings/user/${userId}/all`)
        .expect(200);

      expect(res.body.userProfile).toMatchObject({
        name: '',
        contact: '',
        role: '',
      });
      expect(res.body.companyInfo).toMatchObject({
        companyName: '',
        abn: '',
      });
      expect(res.body.billingAddress).toMatchObject({
        unit: '',
        streetAddress: '',
        suburb: '',
        state: '',
        postcode: '',
      });
    });
  });

  describe('POST /settings/seed', () => {
    it('should seed default settings', async () => {
      await request(app.getHttpServer()).post('/settings/seed').expect(201);
    });
  });
});