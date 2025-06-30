import { INestApplicationContext } from '@nestjs/common';
import { TranscriptService } from '../../src/modules/transcript/transcript.service';
import { TranscriptChunkService } from '../../src/modules/transcript-chunk/transcript-chunk.service';
import { CreateTranscriptChunkDto } from '../../src/modules/transcript-chunk/dto/create-transcript-chunk.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../src/modules/user/schema/user.schema';
import { CalllogService } from '../../src/modules/calllog/calllog.service';

// Mock conversation chunks for each transcript
const mockChunks: CreateTranscriptChunkDto[][] = [
  // Service hours inquiry
  [
    {
      speakerType: 'User' as const,
      text: 'Hello, I would like to know your service hours.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'Our service hours are Monday to Friday, 9 AM to 6 PM.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'Great, can I book an appointment for next week?',
      startAt: 9,
    },
    {
      speakerType: 'AI' as const,
      text: 'Of course! What day and time would work best for you?',
      startAt: 13,
    },
  ],
  // Water damage emergency
  [
    {
      speakerType: 'User' as const,
      text: 'I have an emergency! There\'s water leaking in my bathroom.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I understand this is urgent. Let me help you with that.',
      startAt: 5,
    },
    {
      speakerType: 'User' as const,
      text: 'Yes, it\'s quite bad. Water is dripping from the ceiling.',
      startAt: 9,
    },
    {
      speakerType: 'AI' as const,
      text: 'We can send someone over within the next hour. Is that okay?',
      startAt: 13,
    },
  ],
  // Missed call
  [
    { speakerType: 'User' as const, text: '...', startAt: 0 },
    { speakerType: 'AI' as const, text: 'Sorry, we missed your call. Please try again later.', startAt: 2 },
  ],
  // Pricing inquiry
  [
    {
      speakerType: 'User' as const,
      text: 'Hi, I\'d like to know your service rates.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'d be happy to discuss our service packages. We have several options available.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'Could you send me a detailed quote?',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll prepare that for you right away.',
      startAt: 12,
    },
  ],
  // Emergency repair
  [
    {
      speakerType: 'User' as const,
      text: 'My system has completely failed!',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I understand this is critical. Let me help you right away.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'It\'s affecting my entire operation.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'m dispatching our emergency response team immediately.',
      startAt: 12,
    },
  ],
  // Maintenance inquiry
  [
    {
      speakerType: 'User' as const,
      text: 'I need to schedule regular maintenance.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'We offer several maintenance packages. Let me explain the options.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'What\'s included in the quarterly plan?',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'The quarterly plan includes comprehensive system checks and preventive maintenance.',
      startAt: 12,
    },
  ],
  // Missed call about appointment
  [
    { speakerType: 'User' as const, text: '...', startAt: 0 },
    { speakerType: 'AI' as const, text: 'Missed call during busy hours. No voicemail left.', startAt: 2 },
  ],
  // New installation request
  [
    {
      speakerType: 'User' as const,
      text: 'I need a new system installed.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll help you with that. What are your requirements?',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'I need it installed by next month.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'Let\'s schedule a site survey first to assess the requirements.',
      startAt: 12,
    },
  ],
  // Service follow-up
  [
    {
      speakerType: 'User' as const,
      text: 'The service last week was excellent.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'Thank you for the feedback! Would you like to discuss a maintenance plan?',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'Yes, that would be helpful.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll help you set that up right away.',
      startAt: 12,
    },
  ],
  // System failure emergency
  [
    {
      speakerType: 'User' as const,
      text: 'My system is malfunctioning badly!',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I understand this is urgent. Let me help you immediately.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'It\'s affecting my business operations.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'m dispatching our emergency team right now.',
      startAt: 12,
    },
  ],
  // Missed call about rescheduling
  [
    { speakerType: 'User' as const, text: '...', startAt: 0 },
    { speakerType: 'AI' as const, text: 'Missed call about rescheduling. No message left.', startAt: 2 },
  ],
  // Service feedback
  [
    {
      speakerType: 'User' as const,
      text: 'I wanted to provide some feedback on your service.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'We appreciate your feedback. Please go ahead.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'The technician was very professional and thorough.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'Thank you for your kind words. We\'re always looking to improve.',
      startAt: 12,
    },
  ],
  // Feature upgrade request
  [
    {
      speakerType: 'User' as const,
      text: 'I\'m interested in upgrading my system.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'d be happy to explain our upgrade options.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'What new features are available?',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'Let me walk you through the latest features.',
      startAt: 12,
    },
  ],
  // Maintenance confirmation
  [
    {
      speakerType: 'User' as const,
      text: 'I need to confirm my maintenance appointment.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll help you with that. What\'s your appointment date?',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'It\'s scheduled for next Tuesday.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll send you the preparation instructions.',
      startAt: 12,
    },
  ],
  // Missed call about pricing
  [
    { speakerType: 'User' as const, text: '...', startAt: 0 },
    { speakerType: 'AI' as const, text: 'Missed call about pricing. No message left.', startAt: 2 },
  ],
  // New customer inquiry
  [
    {
      speakerType: 'User' as const,
      text: 'I\'m a new customer and need information.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'Welcome! I\'d be happy to explain our services.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'What services do you offer?',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'Let me walk you through our service offerings.',
      startAt: 12,
    },
  ],
  // Service quality concerns
  [
    {
      speakerType: 'User' as const,
      text: 'I have some concerns about the recent service.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'m sorry to hear that. Let me help address your concerns.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'The system isn\'t working as expected.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll arrange for a follow-up service right away.',
      startAt: 12,
    },
  ],
  // Critical system repair
  [
    {
      speakerType: 'User' as const,
      text: 'My system has failed completely!',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I understand this is critical. Let me help immediately.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'It\'s affecting my entire operation.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'m dispatching our repair team right now.',
      startAt: 12,
    },
  ],
  // Missed call about status
  [
    { speakerType: 'User' as const, text: '...', startAt: 0 },
    { speakerType: 'AI' as const, text: 'Missed call about service status. No message left.', startAt: 2 },
  ],
  // Maintenance scheduling
  [
    {
      speakerType: 'User' as const,
      text: 'I need to schedule maintenance.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll help you with that. What are your needs?',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'Regular quarterly maintenance.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll help you set that up.',
      startAt: 12,
    },
  ],
  // Urgent system failure
  [
    {
      speakerType: 'User' as const,
      text: 'My system has failed!',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I understand this is urgent. Let me help right away.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'It\'s a critical issue.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'m arranging immediate response.',
      startAt: 12,
    },
  ],
  // New installation booking
  [
    {
      speakerType: 'User' as const,
      text: 'I need a new system installed.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll help you with that. What are your requirements?',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'I need it installed soon.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'Let\'s schedule an installation date.',
      startAt: 12,
    },
  ],
  // Missed call about confirmation
  [
    { speakerType: 'User' as const, text: '...', startAt: 0 },
    { speakerType: 'AI' as const, text: 'Missed call about appointment confirmation. No message left.', startAt: 2 },
  ],
  // Service feedback discussion
  [
    {
      speakerType: 'User' as const,
      text: 'I have some feedback about the service.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'We value your feedback. Please share your thoughts.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'The service was excellent.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'Thank you for your kind words.',
      startAt: 12,
    },
  ],
  // Service completion follow-up
  [
    {
      speakerType: 'User' as const,
      text: 'I wanted to follow up on the recent service.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'How was your experience with our service?',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'Everything is working well now.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'Great to hear! Let\'s discuss maintenance.',
      startAt: 12,
    },
  ],
  // Critical issue emergency
  [
    {
      speakerType: 'User' as const,
      text: 'I have an urgent problem!',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I understand this is urgent. Let me help immediately.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'The system is completely down.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'m dispatching our emergency team right now.',
      startAt: 12,
    },
  ],
  // Missed call about quote
  [
    { speakerType: 'User' as const, text: '...', startAt: 0 },
    { speakerType: 'AI' as const, text: 'Missed call about pricing quote. No message left.', startAt: 2 },
  ],
  // New customer service inquiry
  [
    {
      speakerType: 'User' as const,
      text: 'I\'m interested in your services.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'Welcome! Let me explain our services.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'What do you offer?',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'Let me walk you through our offerings.',
      startAt: 12,
    },
  ],
  // Feature upgrade discussion
  [
    {
      speakerType: 'User' as const,
      text: 'I want to upgrade my system.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'d be happy to discuss upgrade options.',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'What new features are available?',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'Let me explain the latest features.',
      startAt: 12,
    },
  ],
  // Maintenance scheduling
  [
    {
      speakerType: 'User' as const,
      text: 'I need to schedule maintenance.',
      startAt: 0,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll help you with that. What are your needs?',
      startAt: 4,
    },
    {
      speakerType: 'User' as const,
      text: 'Regular maintenance service.',
      startAt: 8,
    },
    {
      speakerType: 'AI' as const,
      text: 'I\'ll help you set that up.',
      startAt: 12,
    },
  ]
];

export async function seedTranscriptChunks(app: INestApplicationContext) {
  const transcriptService = app.get(TranscriptService);
  const transcriptChunkService = app.get(TranscriptChunkService);
  const userModel = app.get<Model<UserDocument>>('UserModel');
  const calllogService = app.get(CalllogService);
  
  console.log('📝 Seeding transcript chunks...');
  
  // Get John Admin user from the database
  const johnAdmin = await userModel.findOne({ email: 'john.admin@example.com' }).exec();
  if (!johnAdmin) {
    console.error('❌ John Admin user not found in the database. Please run user seeding first.');
    return;
  }
  const userId = (johnAdmin._id instanceof Types.ObjectId) ? johnAdmin._id.toString() : String(johnAdmin._id);

  // Get all call logs for John Admin
  const { data: callLogs } = await calllogService.findAll({
    userId,
    page: 1,
    limit: 100,
  });
  const calllogIds = callLogs.filter(cl => cl._id).map(cl => cl._id!.toString());

  // Get all transcripts from the database that belong to John Admin's calllogs
  const transcripts = await transcriptService.findAll();
  const filteredTranscripts = transcripts.filter(t => calllogIds.includes(t.calllogId.toString()));

  // Create chunks for each transcript
  for (let i = 0; i < filteredTranscripts.length && i < mockChunks.length; i++) {
    const transcript = filteredTranscripts[i];
    const chunks = mockChunks[i];
    
    try {
      await transcriptChunkService.createMany(transcript._id.toString(), chunks);
      console.log(`✅ Created chunks for transcript ${transcript._id}`);
    } catch (error) {
      console.error(`❌ Failed to create chunks for transcript ${transcript._id}:`, error);
    }
  }
  
  console.log('✅ Transcript chunks seeding completed');
} 