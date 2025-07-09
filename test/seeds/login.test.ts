import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/modules/app.module';
import { AuthService } from '../../src/modules/auth/auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../src/modules/user/schema/user.schema';

describe('Login Functionality', () => {
  let authService: AuthService;
  let userModel: Model<UserDocument>;
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    authService = app.get(AuthService);
    userModel = app.get('UserModel');
  });

  afterAll(async () => {
    await app.close();
  });

  const testCases = [
    {
      email: 'john.admin@example.com',
      password: 'Admin123!',
      description: 'Admin login (local)',
      expectedRole: 'admin',
    },
    {
      email: 'jane.user@example.com',
      password: 'User123!',
      description: 'User login (local)',
      expectedRole: 'user',
    },
    {
      email: 'bob.user@example.com',
      password: 'User123!',
      description: 'Another user login (local)',
      expectedRole: 'user',
    },
    {
      email: 'wrong@example.com',
      password: 'Wrong123!',
      description: 'Invalid credentials',
      shouldFail: true,
    },
    {
      email: 'alice.google@gmail.com',
      password: 'any-password',
      description: 'Google-only user with password (should fail)',
      shouldFail: true,
    },
  ];

  test.each(testCases)('$description', async (testCase) => {
    if (testCase.shouldFail) {
      await expect(
        authService.login({
          email: testCase.email,
          password: testCase.password,
        })
      ).rejects.toThrow();
    } else {
      const result = await authService.login({
        email: testCase.email,
        password: testCase.password,
      });

      expect(result).toHaveProperty('token');
      expect(result.user).toMatchObject({
        email: testCase.email,
        role: testCase.expectedRole,
      });
    }
  });

  describe('Google OAuth User Validation', () => {
    test('validateGoogleUser - new user creation', async () => {
      const googleUser = {
        googleId: 'new-google-id-123',
        email: 'newuser@gmail.com',
        firstName: 'New',
        lastName: 'User',
        avatar: 'https://lh3.googleusercontent.com/a/new-user',
      };

      const result = await authService.validateGoogleUser(googleUser);
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).toMatchObject({
        email: 'newuser@gmail.com',
        firstName: 'New',
        lastName: 'User',
        googleId: 'new-google-id-123',
        provider: 'google',
      });
    });

    test('validateGoogleUser - existing Google user', async () => {
      const googleUser = {
        googleId: '1234567890',
        email: 'alice.google@gmail.com',
        firstName: 'Alice',
        lastName: 'Google',
        avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      };

      const result = await authService.validateGoogleUser(googleUser);
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).toMatchObject({
        email: 'alice.google@gmail.com',
        googleId: '1234567890',
        provider: 'google',
      });
    });

    test('validateGoogleUser - link to existing local account', async () => {
      const googleUser = {
        googleId: 'new-google-id-456',
        email: 'jane.user@example.com',
        firstName: 'Jane',
        lastName: 'User',
        avatar: 'https://lh3.googleusercontent.com/a/jane-user',
      };

      const result = await authService.validateGoogleUser(googleUser);
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).toMatchObject({
        email: 'jane.user@example.com',
        googleId: 'new-google-id-456',
        provider: 'google',
      });
    });
  });
}); 