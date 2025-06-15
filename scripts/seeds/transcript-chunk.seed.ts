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
  // First conversation (about service hours)
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
  // Second conversation (about water damage)
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
  // Third conversation (Missed call)
  [
    { speakerType: 'User' as const, text: '...', startAt: 0 },
    { speakerType: 'AI' as const, text: 'Sorry, we missed your call. Please try again later.', startAt: 2 },
  ],
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