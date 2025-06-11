import { INestApplicationContext } from '@nestjs/common';
import { TranscriptService } from '../../src/modules/transcript/transcript.service';
import { CalllogService } from '../../src/modules/calllog/calllog.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../src/modules/user/schema/user.schema';

const mockTranscripts = [
  {
    summary: 'Customer requested information about service availability',
    keyPoints: [
      'Customer inquired about service hours',
      'Discussed available time slots',
      'Agreed on next week appointment',
    ],
  },
  {
    summary: 'Emergency service request for water damage',
    keyPoints: [
      'Customer reported water leak in bathroom',
      'Assessed urgency level',
      'Scheduled immediate service visit',
    ],
  },
  {
    summary: 'Missed call from customer regarding service inquiry',
    keyPoints: [
      'Customer called but did not leave a message',
      'No further action taken',
    ],
  },
];

export async function seedTranscripts(app: INestApplicationContext) {
  const transcriptService = app.get(TranscriptService);
  const calllogService = app.get(CalllogService);
  const userModel = app.get<Model<UserDocument>>('UserModel');
  
  console.log('📝 Seeding transcripts...');
  
  // Get John Admin user from the database
  const johnAdmin = await userModel.findOne({ email: 'john.admin@example.com' }).exec();
  if (!johnAdmin) {
    console.error('❌ John Admin user not found in the database. Please run user seeding first.');
    return;
  }
  const userId = (johnAdmin._id instanceof Types.ObjectId) ? johnAdmin._id.toString() : String(johnAdmin._id);

  // Get all call logs from the database for John Admin
  const { data: callLogs } = await calllogService.findAll({
    userId,
    page: 1,
    limit: 100,
  });
  
  // Create transcripts for each call log
  for (let i = 0; i < callLogs.length && i < mockTranscripts.length; i++) {
    const callLog = callLogs[i];
    if (!callLog._id) {
      console.error(`❌ Call log at index ${i} has no ID, skipping...`);
      continue;
    }
    
    const transcriptData = {
      ...mockTranscripts[i],
      calllogId: callLog._id,
    };
    
    try {
      await transcriptService.create(transcriptData);
      console.log(`✅ Created transcript for call log ${callLog._id}`);
    } catch (error) {
      console.error(`❌ Failed to create transcript for call log ${callLog._id}:`, error);
    }
  }
  
  console.log('✅ Transcripts seeding completed');
} 