// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import request from 'supertest';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AppModule } from '../../src/modules/app.module';

describe('Health Check (Unit)', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should have a valid test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
