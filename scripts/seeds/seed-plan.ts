import { seedPlanData } from './seed-plan-data';

console.log('🚀 Starting Plan Data Seeding...');
console.log('=====================================');

seedPlanData()
  .then(() => {
    console.log('\n✅ Plan data seeding completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Verify plans in your database');
    console.log('2. Update Stripe price IDs if needed');
    console.log('3. Test plan subscription flows');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ Failed to seed plan data:', error);
    process.exit(1);
  });

