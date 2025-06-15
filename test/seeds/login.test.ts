import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/modules/app.module';
import { AuthService } from '../../src/modules/auth/auth.service';

describe('Login Functionality', () => {
  let authService: AuthService;
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    authService = app.get(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  const testCases = [
    {
      email: 'john.admin@example.com',
      password: 'Admin123!',
      description: 'Admin login',
      expectedRole: 'admin',
    },
    {
      email: 'jane.user@example.com',
      password: 'User123!',
      description: 'User login',
      expectedRole: 'user',
    },
    {
      email: 'wrong@example.com',
      password: 'Wrong123!',
      description: 'Invalid credentials',
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
}); 