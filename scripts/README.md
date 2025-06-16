# Database Seeding Scripts

This directory contains scripts for seeding the database with mock data for development and testing purposes.

## Structure

```
scripts/
├── seeds/
│   ├── index.ts           # Main entry point for running all seeds
│   ├── calllog.seed.ts    # Call log related seed data
│   ├── transcript.seed.ts # Transcript related seed data
│   └── user.seed.ts       # User related seed data
```

## Usage

To run the seeding scripts:

1. Make sure your database is running
2. Run the following command:

```bash
# Using ts-node
npx ts-node scripts/seeds/index.ts

# Or using npm script (if configured in package.json)
npm run seed
```

## Adding New Seeds

1. Create a new seed file in the `seeds` directory (e.g., `new-feature.seed.ts`)
2. Export a function that takes an `INestApplicationContext` parameter
3. Import and add your seed function to `index.ts`

Example:

```typescript
// new-feature.seed.ts
export async function seedNewFeature(app: INestApplicationContext) {
  const service = app.get(NewFeatureService);
  // Add your seeding logic here
}

// index.ts
import { seedNewFeature } from './new-feature.seed';

// Add to the bootstrap function
await seedNewFeature(app);
```

## Notes

- Seeds are run in order: users → call logs → transcripts
- Each seed file contains its own mock data
- Error handling is included to prevent one failed seed from stopping the entire process
- Logs are provided to track the seeding progress 