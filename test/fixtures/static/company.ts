// ============================================================================
// Static Company Mock Data - Provides consistent test data
// ============================================================================

import type { Company } from '../../../src/modules/company/schema/company.schema';

/**
 * Static company data for testing
 * Represents a typical company in the system
 */
export const staticCompany: Partial<Company> = {
  _id: '6640e7330fdebe50da1a05f2' as any,
  businessName: 'Test Company Pty Ltd',
  abn: '12345678901',
  user: '6640e7330fdebe50da1a05f1' as any,
  address: {
    unitAptPOBox: 'Suite 101',
    streetAddress: '123 Test Street',
    suburb: 'Sydney',
    state: 'NSW',
    postcode: '2000',
  },
  twilioPhoneNumber: '+61412345678',
  greeting: {
    message: 'Hello! Welcome to Test Company.',
    isCustom: false,
  },
};

/**
 * Static company for admin user testing
 */
export const staticAdminCompany: Partial<Company> = {
  _id: '6640e7330fdebe50da1a05f3' as any,
  businessName: 'Admin Test Company Ltd',
  abn: '98765432109',
  user: '6640e7330fdebe50da1a05f0' as any, // Different user ID
  address: {
    streetAddress: '456 Admin Avenue',
    suburb: 'Melbourne',
    state: 'VIC',
    postcode: '3000',
  },
  twilioPhoneNumber: '+61487654321',
  greeting: {
    message: 'Hello! Welcome to Admin Test Company.',
    isCustom: false,
  },
};


