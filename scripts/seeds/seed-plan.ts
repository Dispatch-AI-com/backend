import { INestApplicationContext } from '@nestjs/common';
import {PlanService} from '../../src/modules/plan/plan.service';

export default async function seedPlans(app: INestApplicationContext) {
  const planService = app.get(PlanService);


  await planService.createPlan({
    name: 'Free Plan',
    tier: 'FREE',
    features: { callMinutes: 'Unlimited', support: 'No support' },
    pricing: [{ rrule: 'FREQ=MONTHLY', price: 0 }],
    isActive: true,
  });

  await planService.createPlan({
    name: 'Basic Plan',
    tier: 'BASIC',
    features: { callMinutes: 'Unlimited', support: 'Basic support' },
    pricing: [{ rrule: 'FREQ=MONTHLY', price: 49 }],
    isActive: true,
  });

  await planService.createPlan({
    name: 'Pro Plan',
    tier: 'PRO',
    features: { callMinutes: '2000 minutes', support: 'Priority support' },
    pricing: [
      { rrule: 'FREQ=MONTHLY', price: 99 },
    ],
    isActive: true,
  });

  console.log('✅ Seeded Plan data');
}
