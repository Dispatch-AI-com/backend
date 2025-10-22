// ============================================================================
// Dynamic Company Mock Data Generators - Provides customizable test data
// ============================================================================

import type { CreateCompanyDto } from '../../../src/modules/company/dto/create-company.dto';
import type { UpdateCompanyDto } from '../../../src/modules/company/dto/update-company.dto';

/**
 * Create a mock CreateCompanyDto with optional overrides
 */
export function createMockCreateCompanyDto(
  overrides: Partial<CreateCompanyDto> = {},
): CreateCompanyDto {
  return {
    businessName: 'Dynamic Test Company',
    email: 'test@company.com',
    abn: '11122233344',
    user: '6640e7330fdebe50da1a05f1',
    ...overrides,
  };
}

/**
 * Create a mock UpdateCompanyDto with optional overrides
 */
export function createMockUpdateCompanyDto(
  overrides: Partial<UpdateCompanyDto> = {},
): UpdateCompanyDto {
  return {
    businessName: 'Updated Test Company',
    email: 'updated@company.com',
    ...overrides,
  };
}

/**
 * Create multiple mock companies
 */
export function createMockCompanyDtos(
  count: number,
  overrides: Partial<CreateCompanyDto> = {},
): CreateCompanyDto[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCreateCompanyDto({
      businessName: `Test Company ${i + 1}`,
      email: `company${i + 1}@test.com`,
      abn: `1112223334${i}`,
      ...overrides,
    }),
  );
}

