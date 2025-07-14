import { connect, connection, model, Schema, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dispatch-ai';
const SALT_ROUNDS = 10;

interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  fullPhoneNumber: string;
  receivedAdverts: boolean;
  status: string;
  role: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CallLog {
  callSid: string;
  userId: string;
  callerNumber: string;
  callerName?: string;
  status: string;
  startAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Transcript {
  callSid: string;
  summary: string;
  keyPoints: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface TranscriptChunk {
  transcriptId: string;
  speakerType: string;
  text: string;
  startAt: number;
  createdAt: Date;
  updatedAt: Date;
}

const sampleSummaries = [
  'Customer called regarding billing inquiry for recent service. Issue resolved with account adjustment.',
  'Client requested information about service availability in their area. Provided detailed coverage map.',
  'Technical support call about connectivity issues. Guided customer through troubleshooting steps.',
  'New customer inquiry about service packages and pricing. Provided quote and scheduled installation.',
  'Existing customer calling to upgrade their current service plan. Processed upgrade request.',
  'Customer complaint about service interruption. Scheduled technician visit for next day.',
  'Billing dispute regarding unauthorized charges. Investigated and issued refund.',
  'Customer requesting to cancel service. Processed cancellation and arranged equipment return.',
  'Technical issue with equipment malfunction. Arranged replacement device shipment.',
  'Customer feedback about recent service experience. Documented positive feedback.',
  'Inquiry about adding additional services to existing account. Provided pricing options.',
  'Customer reporting intermittent service issues. Scheduled diagnostic check.',
  'New business customer requesting enterprise solutions. Scheduled consultation meeting.',
  'Existing customer moving to new address. Arranged service transfer.',
  'Customer inquiry about payment options and billing cycles. Explained available options.',
  'Technical support for device setup and configuration. Provided step-by-step guidance.',
  'Customer requesting service suspension due to travel. Processed temporary suspension.',
  'Billing inquiry about recent promotional discount. Verified and applied discount.',
  'Customer reporting service outage in their area. Confirmed maintenance work in progress.',
  'Inquiry about referral program and benefits. Provided program details and enrollment.',
  'Customer requesting paper billing instead of electronic. Updated billing preferences.',
  'Technical issue with email configuration. Provided configuration settings.',
  'Customer complaint about poor service quality. Escalated to technical team.',
  'Inquiry about early termination fees and contract terms. Explained policy details.',
  'Customer requesting to add family member to account. Processed additional line.',
  'Technical support for parental controls setup. Configured restrictions as requested.',
  'Customer inquiry about international calling rates. Provided rate card information.',
  'Billing question about tax charges on recent bill. Explained tax breakdown.',
  'Customer requesting service downgrade due to budget constraints. Processed downgrade.',
  'Technical issue with wireless connectivity. Provided troubleshooting steps and solution.'
];

const sampleKeyPoints = [
  ['Billing inquiry', 'Account adjustment', 'Issue resolved'],
  ['Service availability', 'Coverage area', 'Information provided'],
  ['Technical support', 'Connectivity issues', 'Troubleshooting'],
  ['New customer', 'Service packages', 'Installation scheduled'],
  ['Service upgrade', 'Plan change', 'Request processed'],
  ['Service interruption', 'Complaint', 'Technician scheduled'],
  ['Billing dispute', 'Refund issued', 'Investigation completed'],
  ['Service cancellation', 'Equipment return', 'Request processed'],
  ['Equipment malfunction', 'Replacement ordered', 'Technical issue'],
  ['Customer feedback', 'Positive experience', 'Documented'],
  ['Additional services', 'Pricing options', 'Information provided'],
  ['Service issues', 'Diagnostic scheduled', 'Intermittent problems'],
  ['Business customer', 'Enterprise solutions', 'Consultation scheduled'],
  ['Address change', 'Service transfer', 'Relocation support'],
  ['Payment options', 'Billing cycles', 'Information provided'],
  ['Device setup', 'Configuration', 'Technical guidance'],
  ['Service suspension', 'Travel', 'Temporary hold'],
  ['Promotional discount', 'Billing inquiry', 'Discount applied'],
  ['Service outage', 'Maintenance work', 'Area affected'],
  ['Referral program', 'Benefits', 'Enrollment information'],
  ['Billing preferences', 'Paper billing', 'Updated settings'],
  ['Email configuration', 'Technical support', 'Settings provided'],
  ['Service quality', 'Complaint', 'Escalated to technical'],
  ['Early termination', 'Contract terms', 'Policy explained'],
  ['Family member', 'Additional line', 'Account updated'],
  ['Parental controls', 'Setup', 'Restrictions configured'],
  ['International calling', 'Rates', 'Information provided'],
  ['Tax charges', 'Bill inquiry', 'Breakdown explained'],
  ['Service downgrade', 'Budget constraints', 'Plan changed'],
  ['Wireless connectivity', 'Technical issue', 'Solution provided']
];

const sampleChunks = [
  { speaker: 'AI', text: 'Hello, thank you for calling our customer service line. My name is Sarah. How can I help you today?' },
  { speaker: 'User', text: 'Hi Sarah, I have a question about my recent bill. There seems to be an extra charge that I don\'t understand.' },
  { speaker: 'AI', text: 'I\'d be happy to help you with your billing inquiry. Let me pull up your account. Can you please provide me with your account number or the phone number associated with your account?' },
  { speaker: 'User', text: 'Sure, my phone number is 555-123-4567.' },
  { speaker: 'AI', text: 'Thank you. I can see your account now. I\'m looking at your recent bill. Can you tell me which specific charge you\'re concerned about?' },
  { speaker: 'User', text: 'There\'s a $15 charge labeled as "service fee" that wasn\'t there last month.' },
  { speaker: 'AI', text: 'I see the charge you\'re referring to. Let me investigate this for you. This appears to be a one-time setup fee for a recent service change. Did you make any changes to your account recently?' },
  { speaker: 'User', text: 'Oh yes, I did add the premium channel package last month. Is that what this is for?' },
  { speaker: 'AI', text: 'Exactly! That $15 charge is the one-time activation fee for the premium channel package. This is a standard fee for adding new services to your account.' },
  { speaker: 'User', text: 'I wasn\'t aware there would be an activation fee. Nobody mentioned that when I called to add the package.' },
  { speaker: 'AI', text: 'I apologize for the confusion. I can see that the fee wasn\'t clearly explained during your previous call. As a courtesy, I\'ll be happy to credit this activation fee back to your account.' },
  { speaker: 'User', text: 'That would be great, thank you so much!' },
  { speaker: 'AI', text: 'You\'re welcome! I\'ve applied a $15 credit to your account, which will appear on your next bill. Is there anything else I can help you with today?' },
  { speaker: 'User', text: 'No, that covers everything. Thank you for your help, Sarah.' },
  { speaker: 'AI', text: 'You\'re very welcome! Have a great day and thank you for choosing our service.' }
];

const callerNames = [
  'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
  'Jennifer Garcia', 'Robert Miller', 'Lisa Anderson', 'William Taylor', 'Mary Martinez',
  'James Rodriguez', 'Patricia Lewis', 'Christopher Lee', 'Linda Walker', 'Daniel Hall',
  'Barbara Allen', 'Matthew Young', 'Susan King', 'Anthony Wright', 'Nancy Lopez',
  'Mark Hill', 'Karen Scott', 'Steven Green', 'Betty Adams', 'Kenneth Baker',
  'Helen Gonzalez', 'Paul Nelson', 'Sandra Carter', 'Edward Mitchell', 'Donna Perez'
];

const generatePhoneNumber = (): string => {
  const areaCode = Math.floor(Math.random() * 800) + 200;
  const exchange = Math.floor(Math.random() * 800) + 200;
  const number = Math.floor(Math.random() * 10000);
  return `${areaCode}-${exchange}-${number.toString().padStart(4, '0')}`;
};

const generateCallSid = (): string => {
  return `CA${randomUUID().replace(/-/g, '').substring(0, 32)}`;
};

const generateRandomDate = (daysAgo: number): Date => {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  
  const date = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
  date.setHours(randomHours, randomMinutes, 0, 0);
  return date;
};

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateRandomChunks = (transcriptId: any): any[] => {
  const chunks: any[] = [];
  const numChunks = Math.floor(Math.random() * 10) + 5; // 5-14 chunks
  
  for (let i = 0; i < numChunks; i++) {
    const baseChunk = getRandomElement(sampleChunks);
    const chunk = {
      transcriptId,
      speakerType: baseChunk.speaker,
      text: baseChunk.text,
      startAt: i * 30 + Math.floor(Math.random() * 20), // Stagger timing
    };
    chunks.push(chunk);
  }
  
  return chunks;
};

// Create schemas for direct database operations
const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: String,
  fullPhoneNumber: String,
  receivedAdverts: { type: Boolean, default: true },
  status: { type: String, default: 'active' },
  role: { type: String, default: 'user' },
  provider: { type: String, default: 'local' }
}, { timestamps: true });

const callLogSchema = new Schema({
  callSid: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  callerNumber: { type: String, required: true },
  callerName: String,
  status: { type: String, required: true },
  startAt: { type: Date, required: true }
}, { timestamps: true });

const transcriptSchema = new Schema({
  callSid: { type: String, required: true },
  summary: { type: String, required: true },
  keyPoints: [String]
}, { timestamps: true });

const transcriptChunkSchema = new Schema({
  transcriptId: { type: Schema.Types.ObjectId, required: true },
  speakerType: { type: String, enum: ['AI', 'User'], required: true },
  text: { type: String, required: true },
  startAt: { type: Number, required: true }
}, { timestamps: true });

async function seedData() {
  try {
    await connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create models
    const UserModel = model('User', userSchema);
    const CallLogModel = model('CallLog', callLogSchema);
    const TranscriptModel = model('Transcript', transcriptSchema);
    const TranscriptChunkModel = model('TranscriptChunk', transcriptChunkSchema);
    
    // Clear existing data
    await UserModel.deleteMany({});
    await CallLogModel.deleteMany({});
    await TranscriptModel.deleteMany({});
    await TranscriptChunkModel.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);
    const testUser = await UserModel.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: hashedPassword,
      fullPhoneNumber: '+1-555-999-0000',
      receivedAdverts: true,
      status: 'active',
      role: 'user',
      provider: 'local'
    });
    
    console.log('Created test user:', testUser.email);
    
    // Create 30 call logs with associated transcripts and chunks
    console.log('Creating call logs, transcripts, and chunks...');
    
    for (let i = 0; i < 30; i++) {
      const callSid = generateCallSid();
      const startDate = generateRandomDate(30); // Within last 30 days
      
      // Create call log
      const callLog = await CallLogModel.create({
        callSid,
        userId: testUser._id.toString(),
        callerNumber: generatePhoneNumber(),
        callerName: getRandomElement(callerNames),
        status: getRandomElement(['Completed', 'Missed', 'Follow-up']),
        startAt: startDate
      });
      
      // Create transcript for this call
      const transcript = await TranscriptModel.create({
        callSid,
        summary: sampleSummaries[i],
        keyPoints: sampleKeyPoints[i]
      });
      
      // Generate chunks for this transcript
      const chunks = generateRandomChunks(transcript._id);
      
      // Insert chunks for this transcript
      if (chunks.length > 0) {
        await TranscriptChunkModel.insertMany(chunks);
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`Created ${i + 1} call logs with transcripts and chunks`);
      }
    }
    
    console.log('Created 30 call logs with associated transcripts and chunks');
    
    console.log('Seeding completed successfully!');
    console.log('Test user credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await connection.close();
  }
}

seedData().catch(console.error);