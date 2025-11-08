import { connect, connection, model, Schema } from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/dispatchai';

// Plan Schema
const planSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    tier: {
      type: String,
      required: true,
      enum: ['FREE', 'BASIC', 'PRO'],
    },
    pricing: [
      {
        rrule: { type: String, required: true },
        price: { type: Number, required: true },
        stripePriceId: { type: String, required: true },
      },
    ],
    features: {
      callMinutes: { type: String, required: true },
      support: { type: String, required: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Plan data configuration
// Updated with UAT data
const planData = {
  FREE: {
    name: 'Free Plan',
    tier: 'FREE' as const,
    pricing: [
      {
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        price: 0,
        stripePriceId: 'price_free_monthly', // Update with real Stripe price ID
      },
    ],
    features: {
      callMinutes: '100 minutes',
      support: 'Email support',
    },
    isActive: true,
  },
  BASIC: {
    name: 'Basic Plan',
    tier: 'BASIC' as const,
    pricing: [
      {
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        price: 19,
        stripePriceId: 'price_1S4yeoR2XtOFzYzKH32PKqPk',
      },
    ],
    features: {
      callMinutes: '100 Min/Month',
      support: 'Automatic Summary',
    },
    isActive: true,
  },
  PRO: {
    name: 'Pro Plan',
    tier: 'PRO' as const,
    pricing: [
      {
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        price: 79,
        stripePriceId: 'price_1S4yexR2XtOFzYzKm5w8RRrc',
      },
    ],
    features: {
      callMinutes: '1000 Min/Month',
      support: 'Automatic Summary + Service Booking',
    },
    isActive: true,
  },
};

async function seedPlanData() {
  try {
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const PlanModel = model('Plan', planSchema);

    // Seed each plan
    const plans = ['FREE', 'BASIC', 'PRO'] as const;

    for (const tier of plans) {
      const planConfig = planData[tier];

      // Check if plan already exists
      const existingPlan = await PlanModel.findOne({ tier }).exec();

      if (existingPlan) {
        console.log(`🔄 Updating existing ${tier} plan...`);
        await PlanModel.findOneAndUpdate(
          { tier },
          planConfig,
          {
            new: true,
            upsert: false,
            runValidators: true,
          },
        ).exec();
        console.log(`✅ Updated ${tier} plan: ${planConfig.name}`);
      } else {
        console.log(`➕ Creating new ${tier} plan...`);
        await PlanModel.create(planConfig);
        console.log(`✅ Created ${tier} plan: ${planConfig.name}`);
      }
    }

    // Display all plans
    console.log('\n📋 All Plans:');
    const allPlans = await PlanModel.find({ isActive: true })
      .sort({ tier: 1 })
      .exec();

    allPlans.forEach(plan => {
      console.log(`\n${plan.tier} - ${plan.name}`);
      console.log(`  Features:`);
      if (plan.features) {
        console.log(`    - Call Minutes: ${plan.features.callMinutes}`);
        console.log(`    - Support: ${plan.features.support}`);
      } else {
        console.log(`    - Features not available`);
      }
      console.log(`  Pricing:`);
      plan.pricing?.forEach(pricing => {
        const period = pricing.rrule.includes('INTERVAL=3')
          ? 'quarter'
          : pricing.rrule.includes('FREQ=YEARLY')
            ? 'year'
            : 'month';
        console.log(
          `    - $${pricing.price}/${period} (Stripe: ${pricing.stripePriceId})`,
        );
      });
    });

    console.log('\n🚀 Plan Data Seeding Complete!');
  } catch (error) {
    console.error('❌ Error seeding plan data:', error);
    throw error;
  } finally {
    await connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Export for use in other files
export { seedPlanData };

// If running directly
if (require.main === module) {
  console.log('🚀 Starting Plan Data Seeding...');
  console.log('=====================================');

  seedPlanData()
    .then(() => {
      console.log('\n✅ Plan data seeding completed successfully!');
      process.exit(0);
    })
    .catch((error: any) => {
      console.error('❌ Failed to seed plan data:', error);
      process.exit(1);
    });
}

