import { INestApplicationContext } from '@nestjs/common';
import { TranscriptService } from '../../src/modules/transcript/transcript.service';
import { CalllogService } from '../../src/modules/calllog/calllog.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../src/modules/user/schema/user.schema';

const mockTranscripts = [
  {
    summary: 'Customer requested information about service hours',
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
  {
    summary: 'Customer inquiry about service pricing',
    keyPoints: [
      'Discussed standard service rates',
      'Explained package options',
      'Customer requested detailed quote',
    ],
  },
  {
    summary: 'Urgent service request for emergency repair',
    keyPoints: [
      'Customer reported critical system failure',
      'Assessed emergency level',
      'Arranged immediate response team',
    ],
  },
  {
    summary: 'Regular maintenance service inquiry',
    keyPoints: [
      'Discussed maintenance schedule',
      'Explained service packages',
      'Scheduled quarterly maintenance',
    ],
  },
  {
    summary: 'Missed call about service appointment',
    keyPoints: [
      'Customer called during busy hours',
      'No voicemail left',
      'Attempted callback unsuccessful',
    ],
  },
  {
    summary: 'New service request for home installation',
    keyPoints: [
      'Customer requested new system installation',
      'Discussed requirements and timeline',
      'Scheduled site survey',
    ],
  },
  {
    summary: 'Follow-up on previous service completion',
    keyPoints: [
      'Customer satisfied with recent service',
      'Discussed maintenance plan',
      'Scheduled next service date',
    ],
  },
  {
    summary: 'Emergency service needed for system failure',
    keyPoints: [
      'Customer reported system malfunction',
      'Assessed emergency level',
      'Dispatched emergency team',
    ],
  },
  {
    summary: 'Missed call about appointment rescheduling',
    keyPoints: [
      'Customer attempted to reschedule',
      'No message left',
      'Scheduled callback',
    ],
  },
  {
    summary: 'Service quality feedback discussion',
    keyPoints: [
      'Customer provided positive feedback',
      'Discussed service improvements',
      'Thanked for business',
    ],
  },
  {
    summary: 'Request for additional service features',
    keyPoints: [
      'Customer interested in upgrade',
      'Explained new features',
      'Scheduled upgrade appointment',
    ],
  },
  {
    summary: 'Regular maintenance booking confirmation',
    keyPoints: [
      'Confirmed maintenance schedule',
      'Discussed service checklist',
      'Provided preparation instructions',
    ],
  },
  {
    summary: 'Missed call about pricing inquiry',
    keyPoints: [
      'Customer called during lunch break',
      'No message left',
      'Scheduled callback',
    ],
  },
  {
    summary: 'New customer service inquiry',
    keyPoints: [
      'First-time customer inquiry',
      'Explained service offerings',
      'Scheduled initial consultation',
    ],
  },
  {
    summary: 'Follow-up on service quality concerns',
    keyPoints: [
      'Addressed customer concerns',
      'Proposed solutions',
      'Scheduled follow-up service',
    ],
  },
  {
    summary: 'Emergency repair request for critical system',
    keyPoints: [
      'Customer reported system failure',
      'Assessed emergency level',
      'Dispatched repair team',
    ],
  },
  {
    summary: 'Missed call about service status',
    keyPoints: [
      'Customer called for update',
      'No message left',
      'Scheduled callback',
    ],
  },
  {
    summary: 'Regular maintenance inquiry and scheduling',
    keyPoints: [
      'Discussed maintenance needs',
      'Explained service options',
      'Scheduled maintenance visit',
    ],
  },
  {
    summary: 'Urgent service request for system failure',
    keyPoints: [
      'Customer reported critical issue',
      'Assessed emergency level',
      'Arranged immediate response',
    ],
  },
  {
    summary: 'New service booking for installation',
    keyPoints: [
      'Customer requested new installation',
      'Discussed requirements',
      'Scheduled installation date',
    ],
  },
  {
    summary: 'Missed call about appointment confirmation',
    keyPoints: [
      'Customer called to confirm',
      'No message left',
      'Scheduled callback',
    ],
  },
  {
    summary: 'Service quality feedback and improvement discussion',
    keyPoints: [
      'Received customer feedback',
      'Discussed improvements',
      'Thanked for input',
    ],
  },
  {
    summary: 'Follow-up on previous service completion',
    keyPoints: [
      'Checked service satisfaction',
      'Discussed maintenance plan',
      'Scheduled next service',
    ],
  },
  {
    summary: 'Emergency service needed for critical issue',
    keyPoints: [
      'Customer reported urgent problem',
      'Assessed emergency level',
      'Dispatched emergency team',
    ],
  },
  {
    summary: 'Missed call about pricing inquiry',
    keyPoints: [
      'Customer called for quote',
      'No message left',
      'Scheduled callback',
    ],
  },
  {
    summary: 'New customer inquiry about services',
    keyPoints: [
      'First-time customer contact',
      'Explained service options',
      'Scheduled consultation',
    ],
  },
  {
    summary: 'Request for additional service features',
    keyPoints: [
      'Customer interested in upgrade',
      'Discussed new features',
      'Scheduled upgrade',
    ],
  },
  {
    summary: 'Regular maintenance booking and scheduling',
    keyPoints: [
      'Confirmed maintenance schedule',
      'Discussed service details',
      'Provided instructions',
    ],
  }
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