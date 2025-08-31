import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../../src/modules/app.module';
import { SettingCategory } from '../../../src/modules/setting/schema/setting.schema';
import { SettingController } from '../../../src/modules/setting/setting.controller';
import { SettingService } from '../../../src/modules/setting/setting.service';

// Mock SettingService
const mockSettingService = {
  findAll: jest.fn().mockResolvedValue([]),
  getUserSettingsByCategory: jest.fn(),
  updateUserSettings: jest.fn(),
  getAllUserSettings: jest.fn(),
  deleteUserSettingsByCategory: jest.fn(),
  deleteAllUserSettings: jest.fn(),
  seedDefaultSettings: jest.fn()
};

describe('SettingController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [SettingController],
      providers: [{ provide: SettingService, useValue: mockSettingService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 and user profile for GET /settings/user/:userId/profile', async () => {
    const mockProfile = { userId: '123', name: 'Test User' };
    mockSettingService.getUserSettingsByCategory = jest.fn().mockResolvedValue(mockProfile);

    const res = await request(app.getHttpServer()).get('/settings/user/123/profile');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockProfile);
    expect(mockSettingService.getUserSettingsByCategory).toHaveBeenCalledWith(
      '123',
      SettingCategory.USER_PROFILE
    );
  });

  it('should update user profile for PUT /settings/user/:userId/profile', async () => {
    const userId = '123';
    const profileDto = { name: 'Updated User', age: 30 };
    const mockResult = { success: true };

    mockSettingService.updateUserSettings = jest
      .fn()
      .mockResolvedValue(mockResult);

    const res = await request(app.getHttpServer())
      .put(`/settings/user/${userId}/profile`)
      .send(profileDto);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResult);
    expect(mockSettingService.updateUserSettings).toHaveBeenCalledWith(userId, {
      category: SettingCategory.USER_PROFILE,
      settings: profileDto,
    });
  });

  it('should return 200 and user company for GET /settings/user/:userId/company', async () => {
    const mockCompany = { userId: '123', company: 'Test Company' };
    mockSettingService.getUserSettingsByCategory = jest.fn().mockResolvedValue(mockCompany);

    const res = await request(app.getHttpServer()).get('/settings/user/123/company');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockCompany);
    expect(mockSettingService.getUserSettingsByCategory).toHaveBeenCalledWith(
      '123',
      SettingCategory.COMPANY_INFO
    );
  });

  it('should update user company for PUT /settings/user/:userId/company', async () => {
    const userId = '123';
    const companyDto = { name: 'Updated Company', address: 'Updated Address' };
    const mockResult = { success: true };

    mockSettingService.updateUserSettings = jest
      .fn()
      .mockResolvedValue(mockResult);

    const res = await request(app.getHttpServer())
      .put(`/settings/user/${userId}/company`)
      .send(companyDto);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResult);
    expect(mockSettingService.updateUserSettings).toHaveBeenCalledWith(userId, {
      category: SettingCategory.COMPANY_INFO,
      settings: companyDto,
    });
  });

  it('should return 200 and user billing address for GET /settings/user/:userId/billing', async () => {
    const mockBilling = { userId: '123', billing: 'Test Billing' };
    mockSettingService.getUserSettingsByCategory = jest
      .fn()
      .mockResolvedValue(mockBilling);

    const res = await request(app.getHttpServer()).get(
      '/settings/user/123/billing',
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockBilling);
    expect(mockSettingService.getUserSettingsByCategory).toHaveBeenCalledWith(
      '123',
      SettingCategory.BILLING_ADDRESS
    );
  });

  it('should update user billing address for PUT /settings/user/:userId/billing', async () => {
    const userId = '123';
    const billingDto = { address: 'Updated Billing Address' };
    const mockResult = { success: true };

    mockSettingService.updateUserSettings = jest
      .fn()
      .mockResolvedValue(mockResult);

    const res = await request(app.getHttpServer())
      .put(`/settings/user/${userId}/billing`)
      .send(billingDto);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResult);
    expect(mockSettingService.updateUserSettings).toHaveBeenCalledWith(userId, {
      category: SettingCategory.BILLING_ADDRESS,
      settings: billingDto,
    });
  });

  it('should return 200 and all user settings for GET /settings/user/:userId/all', async () => {
    const userId = '123';
    const mockAllSettings = {
      userProfile: { name: 'Test User', age: 30 },
      companyInfo: { companyName: 'Test Co', abn: '123456789' },
      billingAddress: { address: '123 Test St', city: 'Testville' },
    };

    mockSettingService.getAllUserSettings = jest
      .fn()
      .mockResolvedValue(mockAllSettings);

    const res = await request(app.getHttpServer()).get(
      `/settings/user/${userId}/all`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockAllSettings);
    expect(mockSettingService.getAllUserSettings).toHaveBeenCalledWith(userId);
  });

  it('should delete user settings by category for DELETE /settings/user/:userId/category/:category', async () => {
    const userId = '123';
    const category = SettingCategory.USER_PROFILE;

    mockSettingService.deleteUserSettingsByCategory = jest
      .fn()
      .mockResolvedValue(undefined);

    const res = await request(app.getHttpServer()).delete(
      `/settings/user/${userId}/category/${category}`,
    );

    expect(res.status).toBe(204);
    expect(
      mockSettingService.deleteUserSettingsByCategory,
    ).toHaveBeenCalledWith(userId, category);
  });

  it('should delete all user settings for DELETE /settings/user/:userId/all', async () => {
    const userId = '123';

    mockSettingService.deleteAllUserSettings = jest
      .fn()
      .mockResolvedValue(undefined);

    const res = await request(app.getHttpServer()).delete(
      `/settings/user/${userId}/all`,
    );

    expect(res.status).toBe(204);
    expect(mockSettingService.deleteAllUserSettings).toHaveBeenCalledWith(userId);
  });

  it('should initialize default settings for POST /settings/seed', async () => {
    mockSettingService.seedDefaultSettings = jest
      .fn()
      .mockResolvedValue(undefined);

    const res = await request(app.getHttpServer()).post('/settings/seed');

    expect(res.status).toBe(201);
    expect(mockSettingService.seedDefaultSettings).toHaveBeenCalled();
  });

  it('should return 200 and user profile for frontend compatible for GET /settings/frontend/profile/:userId', async () => {
    const mockProfile = { userId: '123', name: 'Test User' };
    mockSettingService.getUserSettingsByCategory = jest
      .fn()
      .mockResolvedValue(mockProfile);

    const res = await request(app.getHttpServer()).get(
      '/settings/frontend/profile/123',
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockProfile);
    expect(mockSettingService.getUserSettingsByCategory).toHaveBeenCalledWith(
      '123',
      SettingCategory.USER_PROFILE
    );
  });

  it('should update user profile for frontend compatible for PUT /settings/frontend/profile/:userId', async () => {
    const userId = '123';
    const profileDto = { name: 'Updated User', age: 31 };
    const mockResult = { success: true };

    mockSettingService.updateUserSettings = jest
      .fn()
      .mockResolvedValue(mockResult);

    const res = await request(app.getHttpServer())
      .put(`/settings/frontend/profile/${userId}`)
      .send(profileDto);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResult);
    expect(mockSettingService.updateUserSettings).toHaveBeenCalledWith(userId, {
      category: SettingCategory.USER_PROFILE,
      settings: profileDto,
    });
  });
});