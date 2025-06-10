import { INestApplicationContext } from '@nestjs/common';
import { CalllogService } from '../../src/modules/calllog/calllog.service';
import { CallLogStatus } from '../../src/common/constants/calllog.constant';

const mockCallLogs = [
  {
    userId: '6847df83a1e3d0985cc7c48c',
    serviceBookedId: 'booking-1',
    callerNumber: '+61400001234',
    callerName: 'John Doe',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-20T10:00:00Z'),
    endAt: new Date('2024-03-20T10:15:00Z'),
    summary: 'Customer requested information about service availability and scheduled an appointment for next week.',
  },
  {
    userId: '6847df83a1e3d0985cc7c48c',
    serviceBookedId: 'booking-2',
    callerNumber: '+61400005678',
    callerName: 'Jane Smith',
    status: CallLogStatus.FollowUp,
    startAt: new Date('2024-03-20T11:00:00Z'),
    summary: 'Emergency service request for water damage in bathroom. Customer needs immediate assistance.',
  },
  {
    userId: '6847df83a1e3d0985cc7c48c',
    serviceBookedId: 'booking-3',
    callerNumber: '+61400009012',
    callerName: 'Bob Wilson',
    status: CallLogStatus.Missed,
    startAt: new Date('2024-03-20T12:00:00Z'),
    summary: 'Missed call from customer regarding service inquiry.',
  },
];

export async function seedCallLogs(app: INestApplicationContext) {
  const calllogService = app.get(CalllogService);
  
  console.log('📞 Seeding call logs...');
  
  for (const callLog of mockCallLogs) {
    try {
      await calllogService.create(callLog);
      console.log(`✅ Created call log for ${callLog.callerName}`);
    } catch (error) {
      console.error(`❌ Failed to create call log for ${callLog.callerName}:`, error);
    }
  }
  
  console.log('✅ Call logs seeding completed');
} 