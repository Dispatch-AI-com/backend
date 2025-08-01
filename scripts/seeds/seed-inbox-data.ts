import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomUUID, randomInt } from 'crypto';

const { connect, connection, model, Schema, Types } = mongoose;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dispatch-ai';
const SALT_ROUNDS = 10;

interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  twilioPhoneNumber: string;
  fullPhoneNumber: string;
  receivedAdverts: boolean;
  status: string;
  statusReason?: string;
  position?: string;
  role: string;
  googleId?: string;
  avatar?: string;
  provider: string;
  tokenRefreshTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Service {
  userId: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CallLog {
  callSid: string;
  userId: string;
  serviceBookedId?: string;
  callerNumber: string;
  callerName?: string;
  startAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceBooking {
  serviceId: string;
  client: {
    name: string;
    phoneNumber: string;
    address: string;
  };
  serviceFormValues: {
    serviceFieldId: string;
    answer: string;
  }[];
  status: string;
  note?: string;
  bookingTime: Date;
  userId: string;
  callSid?: string;
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

const sampleServices = [
  { name: 'Plumbing Service', description: 'Professional plumbing repair and installation', price: 120 },
  { name: 'Electrical Work', description: 'Electrical repairs and installations', price: 150 },
  { name: 'HVAC Maintenance', description: 'Heating, ventilation, and air conditioning services', price: 200 },
  { name: 'Cleaning Service', description: 'Residential and commercial cleaning', price: 80 },
  { name: 'Landscaping', description: 'Garden maintenance and landscaping services', price: 100 },
  { name: 'Carpentry', description: 'Custom woodwork and repairs', price: 130 },
  { name: 'Roofing', description: 'Roof repair and installation', price: 300 },
  { name: 'Painting', description: 'Interior and exterior painting services', price: 90 },
  { name: 'Appliance Repair', description: 'Home appliance repair and maintenance', price: 110 },
  { name: 'Security Installation', description: 'Security system installation and maintenance', price: 250 }
];

const sampleAddresses = [
  '123 Main St, Sydney NSW 2000',
  '456 Park Ave, Melbourne VIC 3000',
  '789 Queen St, Brisbane QLD 4000',
  '321 Collins St, Perth WA 6000',
  '654 Adelaide St, Adelaide SA 5000',
  '987 George St, Hobart TAS 7000',
  '147 Flinders St, Darwin NT 0800',
  '258 Hay St, Canberra ACT 2600',
  '369 Murray St, Gold Coast QLD 4215',
  '741 Bourke St, Newcastle NSW 2300'
];

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
  // Conversation Set 1: Billing Inquiry
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
  { speaker: 'AI', text: 'You\'re very welcome! Have a great day and thank you for choosing our service.' },

  // Conversation Set 2: Technical Support
  { speaker: 'AI', text: 'Good morning! This is Alex from technical support. How can I assist you today?' },
  { speaker: 'User', text: 'Hi Alex, I\'m having trouble with my internet connection. It keeps dropping out every few minutes.' },
  { speaker: 'AI', text: 'I\'m sorry to hear you\'re experiencing connection issues. Let\'s troubleshoot this together. First, can you tell me what type of device you\'re using and when this started happening?' },
  { speaker: 'User', text: 'I\'m using my laptop, and this started happening about two days ago. My phone seems to work fine on the same network though.' },
  { speaker: 'AI', text: 'That\'s helpful information. It sounds like it might be specific to your laptop. Let\'s start by checking your WiFi adapter settings. Can you go to your Network and Internet settings?' },
  { speaker: 'User', text: 'Okay, I\'m there now. What should I look for?' },
  { speaker: 'AI', text: 'Great! Now click on "Change adapter options" and look for your WiFi connection. Right-click on it and select "Properties".' },
  { speaker: 'User', text: 'I see the properties window. There are a lot of options here.' },
  { speaker: 'AI', text: 'Perfect. Now click on "Configure" button, then go to the "Power Management" tab. Make sure "Allow the computer to turn off this device to save power" is unchecked.' },
  { speaker: 'User', text: 'Oh, it was checked! I\'ve unchecked it now. Is that what was causing the problem?' },
  { speaker: 'AI', text: 'Very likely! That setting can cause Windows to turn off your WiFi adapter to save power, which results in connection drops. Try using your internet for the next hour and see if the problem persists.' },
  { speaker: 'User', text: 'That makes perfect sense. I\'ll test it out and call back if I still have issues. Thank you so much for your help!' },
  { speaker: 'AI', text: 'You\'re welcome! I\'m confident this will solve the issue. If you do experience any more problems, don\'t hesitate to call us back. Have a great day!' },

  // Conversation Set 3: Service Upgrade
  { speaker: 'AI', text: 'Thank you for calling! This is Emma from customer service. How may I help you today?' },
  { speaker: 'User', text: 'Hi Emma, I\'m interested in upgrading my current service plan. I\'ve been having some speed issues lately.' },
  { speaker: 'AI', text: 'I\'d be happy to help you explore upgrade options. Let me first look at your current plan and usage patterns. Can you provide your account number or the phone number on the account?' },
  { speaker: 'User', text: 'The phone number is 555-987-6543.' },
  { speaker: 'AI', text: 'Thank you. I can see you\'re currently on our Standard plan with 50 Mbps download speed. What kind of activities are you doing that require more speed?' },
  { speaker: 'User', text: 'Well, I work from home now and do a lot of video conferencing. Plus my kids are always streaming videos and playing online games. Everything seems to slow down, especially in the evenings.' },
  { speaker: 'AI', text: 'That definitely sounds like you could benefit from an upgrade. With multiple devices and high-bandwidth activities, I\'d recommend our Premium plan with 200 Mbps or our Ultra plan with 500 Mbps. The Premium plan would be $20 more per month, and Ultra would be $35 more.' },
  { speaker: 'User', text: 'What\'s the difference between the two? Is 200 Mbps enough for our household?' },
  { speaker: 'AI', text: 'For a household with multiple users doing video conferencing and streaming, 200 Mbps should handle 3-4 simultaneous HD streams plus video calls comfortably. The 500 Mbps plan is better if you have 5+ users or do 4K streaming regularly.' },
  { speaker: 'User', text: 'I think the 200 Mbps plan sounds perfect for us. How soon can we get this upgraded?' },
  { speaker: 'AI', text: 'Excellent choice! I can process this upgrade right now, and it will take effect within 2-4 hours. You\'ll see the new speeds and the price change on your next bill. There\'s no installation required since you already have compatible equipment.' },
  { speaker: 'User', text: 'That\'s fantastic! Please go ahead and upgrade us to the Premium plan.' },
  { speaker: 'AI', text: 'Perfect! I\'ve successfully upgraded your account to the Premium 200 Mbps plan. You should start seeing improved speeds within a few hours. Is there anything else I can help you with today?' },
  { speaker: 'User', text: 'No, that\'s everything. Thank you so much for your help, Emma!' },
  { speaker: 'AI', text: 'You\'re very welcome! Enjoy your faster internet, and don\'t hesitate to call if you need anything else. Have a wonderful day!' },

  // Conversation Set 4: New Customer Inquiry
  { speaker: 'AI', text: 'Good afternoon! This is Michael from sales. Thank you for your interest in our services. How can I help you today?' },
  { speaker: 'User', text: 'Hi Michael, I just moved to a new apartment and need to set up internet service. What packages do you have available?' },
  { speaker: 'AI', text: 'Congratulations on your new place! I\'d be happy to help you get connected. First, let me check service availability in your area. What\'s your new address?' },
  { speaker: 'User', text: 'It\'s 456 Oak Street, Apartment 3B, in downtown.' },
  { speaker: 'AI', text: 'Great news! We have full service availability at that location. We offer three main residential plans: Basic at 25 Mbps for $39.99, Standard at 100 Mbps for $59.99, and Premium at 300 Mbps for $79.99. All include a WiFi router and 24/7 support.' },
  { speaker: 'User', text: 'I mainly use the internet for streaming Netflix, browsing, and some light work from home. What would you recommend?' },
  { speaker: 'AI', text: 'For your usage, the Standard plan at 100 Mbps would be perfect. It easily handles multiple streaming devices, video calls, and general browsing without any issues. Plus, it gives you room to grow if your needs change.' },
  { speaker: 'User', text: 'That sounds good. What about installation? Is there a fee?' },
  { speaker: 'AI', text: 'For new customers, we offer free professional installation, which includes setting up your modem and WiFi router. Our earliest available appointment would be this Friday between 9 AM and 12 PM, or we have afternoon slots available.' },
  { speaker: 'User', text: 'Friday morning works perfectly for me. How do we proceed?' },
  { speaker: 'AI', text: 'Excellent! I\'ll need to collect some basic information to set up your account and schedule the installation. Can I start with your full name and contact information?' },
  { speaker: 'User', text: 'Sure, my name is Jennifer Martinez, and my phone number is 555-234-5678.' },
  { speaker: 'AI', text: 'Thank you, Jennifer. I\'ll also need your email address, and then I can get you set up with the Standard plan and Friday morning installation.' },
  { speaker: 'User', text: 'My email is jennifer.martinez@email.com. Will I receive a confirmation?' },
  { speaker: 'AI', text: 'Absolutely! You\'ll receive an email confirmation within the next hour with all the details, including your installation appointment and what to expect. Welcome to our service family, Jennifer!' },

  // Conversation Set 5: Service Cancellation
  { speaker: 'AI', text: 'Hello, this is David from customer retention. I understand you\'re calling about your account today. How can I help you?' },
  { speaker: 'User', text: 'Hi David, I need to cancel my service. I\'m moving out of state for a job and you don\'t provide service in that area.' },
  { speaker: 'AI', text: 'I understand you\'re relocating for work - congratulations on the new job! Let me check if we have any partner providers in your new area that might offer a seamless transition.' },
  { speaker: 'User', text: 'I\'m moving to a small town in Montana. I already checked and there\'s no coverage there.' },
  { speaker: 'AI', text: 'I see. I\'m sorry we won\'t be able to continue serving you in Montana. Let me make this process as smooth as possible. When is your move date?' },
  { speaker: 'User', text: 'I\'ll be moving on the 15th of next month, so I\'d like to cancel service effective that date.' },
  { speaker: 'AI', text: 'Perfect, I can schedule your service to end on the 15th. You\'ll be billed for the partial month up to that date. Do you have any equipment that needs to be returned?' },
  { speaker: 'User', text: 'Yes, I have the modem and WiFi router you provided. How do I return those?' },
  { speaker: 'AI', text: 'I\'ll arrange for a prepaid return kit to be sent to you. It should arrive within 3-5 business days and includes everything needed to safely return the equipment. You\'ll have 30 days after your service ends to return it.' },
  { speaker: 'User', text: 'That\'s very convenient. Is there anything else I need to do?' },
  { speaker: 'AI', text: 'Just one more thing - I\'ll send you a cancellation confirmation email with all the details and a reference number. If you ever move back to our service area, we\'d love to have you as a customer again.' },
  { speaker: 'User', text: 'Thank you, David. You\'ve made this much easier than I expected.' },
  { speaker: 'AI', text: 'You\'re very welcome! Best of luck with your new job and the move. Thank you for being our customer, and have a great day!' },

  // Additional conversation chunks for variety
  { speaker: 'AI', text: 'Thank you for calling support. This is Lisa. What can I help you with today?' },
  { speaker: 'User', text: 'My internet has been really slow all morning. Is there an outage in my area?' },
  { speaker: 'AI', text: 'Let me check that for you right away. Can you give me your zip code?' },
  { speaker: 'User', text: 'It\'s 90210.' },
  { speaker: 'AI', text: 'I\'m showing some maintenance work in your area that should be completed within the next two hours.' },
  
  { speaker: 'AI', text: 'Good evening! This is Tom from customer service. How may I assist you?' },
  { speaker: 'User', text: 'I need to change my billing address. I recently moved.' },
  { speaker: 'AI', text: 'I\'d be happy to update your billing address. Can you verify your account with the phone number on file?' },
  
  { speaker: 'AI', text: 'Hello, this is Rachel. Thank you for calling. What brings you in today?' },
  { speaker: 'User', text: 'I\'m getting married next month and want to add my fiancé to my account.' },
  { speaker: 'AI', text: 'Congratulations! I\'d be delighted to help you add your fiancé to the account.' },
  
  { speaker: 'AI', text: 'This is Kevin from technical support. How can I help you today?' },
  { speaker: 'User', text: 'I can\'t connect to WiFi on my new tablet. All my other devices work fine.' },
  { speaker: 'AI', text: 'Let\'s get your tablet connected. First, can you tell me what model tablet you have?' },
  
  { speaker: 'User', text: 'I keep getting disconnected during video calls. It\'s affecting my work.' },
  { speaker: 'AI', text: 'I understand how frustrating that must be. Let\'s run a connection diagnostic to identify the issue.' },
  
  { speaker: 'User', text: 'Can you explain why my bill went up this month?' },
  { speaker: 'AI', text: 'Of course! Let me review your account and explain any changes to your billing.' },
  
  { speaker: 'User', text: 'I want to downgrade my plan to save money.' },
  { speaker: 'AI', text: 'I understand you\'re looking to reduce costs. Let me show you our available options that might work better for your budget.' },
  
  { speaker: 'User', text: 'Is it possible to get a better deal on my current plan?' },
  { speaker: 'AI', text: 'Let me check what promotions and discounts might be available for your account.' },
  
  { speaker: 'User', text: 'I need to temporarily suspend my service while I travel abroad for three months.' },
  { speaker: 'AI', text: 'Absolutely! We offer a travel suspension option. Let me set that up for you and explain how it works.' },
  
  { speaker: 'User', text: 'My router keeps rebooting itself every few hours.' },
  { speaker: 'AI', text: 'That sounds like it could be a hardware issue. Let me run some diagnostics and see if we need to replace your router.' }
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
  const areaCode = randomInt(200, 1000); // 200-999 inclusive
  const exchange = randomInt(200, 1000); // 200-999 inclusive
  const number = randomInt(0, 10000);    // 0-9999 inclusive
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
  
  // Choose a conversation type (more chunks for longer conversations)
  const conversationType = Math.random();
  let selectedChunks: typeof sampleChunks = [];
  
  if (conversationType < 0.3) {
    // Long complete conversation (15-30 chunks)
    const fullConversations = [
      sampleChunks.slice(0, 15),   // Billing inquiry conversation
      sampleChunks.slice(15, 27),  // Technical support conversation  
      sampleChunks.slice(27, 39),  // Service upgrade conversation
      sampleChunks.slice(39, 53),  // New customer inquiry
      sampleChunks.slice(53, 65)   // Service cancellation
    ];
    selectedChunks = getRandomElement(fullConversations);
  } else if (conversationType < 0.6) {
    // Medium conversation (8-15 chunks)
    const numChunks = Math.floor(Math.random() * 8) + 8;
    selectedChunks = [];
    for (let i = 0; i < numChunks; i++) {
      selectedChunks.push(getRandomElement(sampleChunks));
    }
  } else {
    // Short conversation (5-12 chunks) - mixed from additional chunks
    const numChunks = Math.floor(Math.random() * 8) + 5;
    const additionalChunks = sampleChunks.slice(65); // Get the shorter conversation pieces
    selectedChunks = [];
    for (let i = 0; i < numChunks; i++) {
      if (additionalChunks.length > 0 && Math.random() < 0.7) {
        selectedChunks.push(getRandomElement(additionalChunks));
      } else {
        selectedChunks.push(getRandomElement(sampleChunks));
      }
    }
  }
  
  // Convert to chunks format with proper timing
  selectedChunks.forEach((baseChunk, i) => {
    const chunk = {
      transcriptId,
      speakerType: baseChunk.speaker,
      text: baseChunk.text,
      startAt: i * 25 + Math.floor(Math.random() * 15), // More realistic timing variation
    };
    chunks.push(chunk);
  });
  
  return chunks;
};

// Create schemas for direct database operations
const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: String,
  twilioPhoneNumber: String,
  fullPhoneNumber: String,
  receivedAdverts: { type: Boolean, default: true },
  status: { type: String, default: 'active' },
  statusReason: String,
  position: String,
  role: { type: String, default: 'user' },
  googleId: String,
  avatar: String,
  provider: { type: String, default: 'local' },
  tokenRefreshTime: { type: Date, default: Date.now }
}, { timestamps: true });

const serviceSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const callLogSchema = new Schema({
  callSid: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  serviceBookedId: String,
  callerNumber: { type: String, required: true },
  callerName: String,
  startAt: { type: Date, required: true }
}, { timestamps: true });

const serviceBookingSchema = new Schema({
  serviceId: { type: String, required: true },
  client: {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true }
  },
  serviceFormValues: [{
    serviceFieldId: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  status: { type: String, enum: ['Cancelled', 'Confirmed', 'Done'], default: 'Confirmed' },
  note: String,
  bookingTime: { type: Date, required: true },
  userId: { type: String, required: true },
  callSid: String
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
    const ServiceModel = model('Service', serviceSchema);
    const CallLogModel = model('CallLog', callLogSchema);
    const ServiceBookingModel = model('ServiceBooking', serviceBookingSchema);
    const TranscriptModel = model('Transcript', transcriptSchema);
    const TranscriptChunkModel = model('TranscriptChunk', transcriptChunkSchema);
    
    // Clear existing data
    await UserModel.deleteMany({});
    await ServiceModel.deleteMany({});
    await CallLogModel.deleteMany({});
    await ServiceBookingModel.deleteMany({});
    await TranscriptModel.deleteMany({});
    await TranscriptChunkModel.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create test user
    const hashedPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
    const testUser = await UserModel.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: hashedPassword,
      twilioPhoneNumber: '+1-555-999-0000',
      fullPhoneNumber: '+1-555-999-0000',
      receivedAdverts: true,
      status: 'active',
      statusReason: '',
      position: 'Customer Service Manager',
      role: 'user',
      googleId: null,
      avatar: null,
      provider: 'local',
      tokenRefreshTime: new Date()
    });
    
    console.log('Created test user:', testUser.email);
    
    // Create sample services
    console.log('Creating sample services...');
    const services = [];
    for (const serviceData of sampleServices) {
      const service = await ServiceModel.create({
        userId: testUser._id.toString(),
        ...serviceData
      });
      services.push(service);
    }
    console.log(`Created ${services.length} services`);
    
    // Create 30 call logs with associated service bookings, transcripts and chunks
    console.log('Creating call logs, service bookings, transcripts, and chunks...');
    
    for (let i = 0; i < 30; i++) {
      const callSid = generateCallSid();
      const startDate = generateRandomDate(30); // Within last 30 days
      const service = getRandomElement(services);
      const callerName = getRandomElement(callerNames);
      const callerPhone = generatePhoneNumber();
      const address = getRandomElement(sampleAddresses);
      
      // Create service booking for this call
      const serviceBooking = await ServiceBookingModel.create({
        serviceId: service._id.toString(),
        client: {
          name: callerName,
          phoneNumber: callerPhone,
          address: address
        },
        serviceFormValues: [
          {
            serviceFieldId: 'booking_source',
            answer: 'Phone Call'
          },
          {
            serviceFieldId: 'call_sid',
            answer: callSid
          },
          {
            serviceFieldId: 'service_type',
            answer: service.name
          }
        ],
        status: getRandomElement(['Confirmed', 'Done', 'Cancelled']),
        note: `Service booking created from phone call. CallSid: ${callSid}`,
        bookingTime: startDate,
        userId: testUser._id.toString(),
        callSid: callSid
      });
      
      // Create call log
      const callLog = await CallLogModel.create({
        callSid,
        userId: testUser._id.toString(),
        serviceBookedId: serviceBooking._id.toString(),
        callerNumber: callerPhone,
        callerName: callerName,
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
        console.log(`Created ${i + 1} call logs with service bookings, transcripts and chunks`);
      }
    }
    
    console.log('Created 30 call logs with associated service bookings, transcripts and chunks');
    
    console.log('Seeding completed successfully!');
    console.log('Test user credentials:');
    console.log('Email: test@example.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await connection.close();
  }
}

seedData().catch(console.error);