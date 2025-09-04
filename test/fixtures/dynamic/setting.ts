export function createMockUserProfileDto() {
  return {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '0987654321',
  };
}

export function createMockCompanyInfoDto() {
  return {
    companyName: 'Beta Ltd',
    abn: '98765432109',
    address: '456 Side St',
  };
}

export function createMockBillingAddressDto() {
  return {
    addressLine1: '1010 Invoice Ave',
    addressLine2: 'Suite 5',
    city: 'Melbourne',
    state: 'VIC',
    postcode: '3000',
    country: 'Australia',
  };
}