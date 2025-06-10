import { INestApplicationContext } from '@nestjs/common';
import { TranscriptService } from '../../src/modules/transcript/transcript.service';

const mockTranscripts = [
  {
    calllogId: 'calllog-1',
    summary: 'Customer requested information about service availability',
    keyPoints: [
      'Customer inquired about service hours',
      'Discussed available time slots',
      'Agreed on next week appointment',
    ],
  },
  {
    calllogId: 'calllog-2',
    summary: 'Emergency service request for water damage',
    keyPoints: [
      'Customer reported water leak in bathroom',
      'Assessed urgency level',
      'Scheduled immediate service visit',
    ],
  },
];

export async function seedTranscripts(app: INestApplicationContext) {
  const transcriptService = app.get(TranscriptService);
  
  console.log('📝 Seeding transcripts...');
  
  for (const transcript of mockTranscripts) {
    try {
      await transcriptService.create(transcript);
      console.log(`✅ Created transcript for call log ${transcript.calllogId}`);
    } catch (error) {
      console.error(`❌ Failed to create transcript for call log ${transcript.calllogId}:`, error);
    }
  }
  
  console.log('✅ Transcripts seeding completed');
} 