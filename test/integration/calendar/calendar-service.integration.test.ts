import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../../src/modules/app.module';
import { DatabaseTestHelper } from '../../helpers/database.helper';
import { TEST_USER } from '../../setup';

// ============================================================================
// Service Integration Tests - Only testing methods used by frontend calendar
// ============================================================================

describe('ServiceController (Integration) - Calendar Focus', () => {
  let app: INestApplication;
  let dbHelper: DatabaseTestHelper;
  let userId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    dbHelper = new DatabaseTestHelper(moduleFixture);

    // Create a test user
    const user = await dbHelper.createUser({
      _id: TEST_USER._id,
      email: TEST_USER.email,
      firstName: 'Test',
      lastName: 'User',
      fullPhoneNumber: '+61123456789',
      position: 'Manager',
    });
    userId = (user._id as string | number).toString();
  });

  afterEach(async () => {
    await dbHelper.cleanupAll();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /service - Used by frontend calendar', () => {
    it('should return all services for a user', async () => {
      // Create test services
      await dbHelper.createService({
        name: 'Service 1',
        description: 'Test service 1',
        duration: 60,
        price: 100,
        userId: userId,
        isActive: true,
      });

      await dbHelper.createService({
        name: 'Service 2',
        description: 'Test service 2',
        duration: 90,
        price: 150,
        userId: userId,
        isActive: true,
      });

      const res = await request(app.getHttpServer())
        .get('/service')
        .query({ userId })
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({
        name: 'Service 1',
        description: 'Test service 1',
        price: 100,
      });
    });

    it('should return empty array when no services exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/service')
        .query({ userId })
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('should return all services when no userId provided', async () => {
      // Create services for different users
      await dbHelper.createService({
        name: 'Service 1',
        description: 'Test service 1',
        duration: 60,
        price: 100,
        userId: userId,
        isActive: true,
      });

      await dbHelper.createService({
        name: 'Service 2',
        description: 'Test service 2',
        duration: 90,
        price: 150,
        userId: 'other-user',
        isActive: true,
      });

      const res = await request(app.getHttpServer())
        .get('/service')
        .expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('should filter services by userId when provided', async () => {
      // Create service for current user
      await dbHelper.createService({
        name: 'User Service',
        description: 'User specific service',
        duration: 60,
        price: 100,
        userId: userId,
        isActive: true,
      });

      // Create service for different user
      await dbHelper.createService({
        name: 'Other Service',
        description: 'Other user service',
        duration: 90,
        price: 150,
        userId: 'other-user',
        isActive: true,
      });

      const res = await request(app.getHttpServer())
        .get('/service')
        .query({ userId })
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        name: 'User Service',
        description: 'User specific service',
      });
    });

    it('should handle invalid userId format', async () => {
      const res = await request(app.getHttpServer())
        .get('/service')
        .query({ userId: 'invalid-id' })
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });
});
