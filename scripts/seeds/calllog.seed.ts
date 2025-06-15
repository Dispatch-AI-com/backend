import { INestApplicationContext } from '@nestjs/common';
import { CalllogService } from '../../src/modules/calllog/calllog.service';
import { CallLogStatus } from '../../src/common/constants/calllog.constant';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../src/modules/user/schema/user.schema';

const mockCallLogs = [
  {
    serviceBookedId: 'booking-1',
    callerNumber: '+61400001234',
    callerName: 'John Doe',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-20T10:00:00Z'),
    endAt: new Date('2024-03-20T10:15:00Z'),
    summary: 'Asked about service hours.',
  },
  {
    serviceBookedId: 'booking-2',
    callerNumber: '+61400005678',
    callerName: 'Jane Smith',
    status: CallLogStatus.FollowUp,
    startAt: new Date('2024-03-20T11:00:00Z'),
    summary: 'Emergency water damage.',
  },
  {
    serviceBookedId: 'booking-3',
    callerNumber: '+61400009012',
    callerName: 'Bob Wilson',
    status: CallLogStatus.Missed,
    startAt: new Date('2024-03-20T12:00:00Z'),
    summary: 'Missed call inquiry.',
  },
  {
    serviceBookedId: 'booking-4',
    callerNumber: '+61400001235',
    callerName: 'Alice Brown',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-20T13:00:00Z'),
    endAt: new Date('2024-03-20T13:20:00Z'),
    summary: 'Inquiry about pricing.',
  },
  {
    serviceBookedId: 'booking-5',
    callerNumber: '+61400005679',
    callerName: 'Charlie Davis',
    status: CallLogStatus.FollowUp,
    startAt: new Date('2024-03-20T14:00:00Z'),
    summary: 'Request for urgent service.',
  },
  {
    serviceBookedId: 'booking-6',
    callerNumber: '+61400009013',
    callerName: 'Emma Wilson',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-20T15:00:00Z'),
    endAt: new Date('2024-03-20T15:30:00Z'),
    summary: 'Regular maintenance inquiry.',
  },
  {
    serviceBookedId: 'booking-7',
    callerNumber: '+61400001236',
    callerName: 'Frank Miller',
    status: CallLogStatus.Missed,
    startAt: new Date('2024-03-20T16:00:00Z'),
    summary: 'Missed call about service.',
  },
  {
    serviceBookedId: 'booking-8',
    callerNumber: '+61400005680',
    callerName: 'Grace Lee',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-20T17:00:00Z'),
    endAt: new Date('2024-03-20T17:15:00Z'),
    summary: 'New service request.',
  },
  {
    serviceBookedId: 'booking-9',
    callerNumber: '+61400009014',
    callerName: 'Henry Taylor',
    status: CallLogStatus.FollowUp,
    startAt: new Date('2024-03-20T18:00:00Z'),
    summary: 'Follow-up on previous service.',
  },
  {
    serviceBookedId: 'booking-10',
    callerNumber: '+61400001237',
    callerName: 'Ivy Chen',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-20T19:00:00Z'),
    endAt: new Date('2024-03-20T19:25:00Z'),
    summary: 'Emergency service needed.',
  },
  {
    serviceBookedId: 'booking-11',
    callerNumber: '+61400005681',
    callerName: 'Jack Anderson',
    status: CallLogStatus.Missed,
    startAt: new Date('2024-03-21T09:00:00Z'),
    summary: 'Missed call about appointment.',
  },
  {
    serviceBookedId: 'booking-12',
    callerNumber: '+61400009015',
    callerName: 'Kelly Martinez',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-21T10:00:00Z'),
    endAt: new Date('2024-03-21T10:40:00Z'),
    summary: 'Service quality feedback.',
  },
  {
    serviceBookedId: 'booking-13',
    callerNumber: '+61400001238',
    callerName: 'Liam Johnson',
    status: CallLogStatus.FollowUp,
    startAt: new Date('2024-03-21T11:00:00Z'),
    summary: 'Request for additional service.',
  },
  {
    serviceBookedId: 'booking-14',
    callerNumber: '+61400005682',
    callerName: 'Mia Thompson',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-21T12:00:00Z'),
    endAt: new Date('2024-03-21T12:35:00Z'),
    summary: 'Regular maintenance booking.',
  },
  {
    serviceBookedId: 'booking-15',
    callerNumber: '+61400009016',
    callerName: 'Noah White',
    status: CallLogStatus.Missed,
    startAt: new Date('2024-03-21T13:00:00Z'),
    summary: 'Missed call about pricing.',
  },
  {
    serviceBookedId: 'booking-16',
    callerNumber: '+61400001239',
    callerName: 'Olivia Garcia',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-21T14:00:00Z'),
    endAt: new Date('2024-03-21T14:45:00Z'),
    summary: 'New customer inquiry.',
  },
  {
    serviceBookedId: 'booking-17',
    callerNumber: '+61400005683',
    callerName: 'Peter Brown',
    status: CallLogStatus.FollowUp,
    startAt: new Date('2024-03-21T15:00:00Z'),
    summary: 'Follow-up on service quality.',
  },
  {
    serviceBookedId: 'booking-18',
    callerNumber: '+61400009017',
    callerName: 'Quinn Lee',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-21T16:00:00Z'),
    endAt: new Date('2024-03-21T16:20:00Z'),
    summary: 'Emergency repair request.',
  },
  {
    serviceBookedId: 'booking-19',
    callerNumber: '+61400001240',
    callerName: 'Ryan Wilson',
    status: CallLogStatus.Missed,
    startAt: new Date('2024-03-21T17:00:00Z'),
    summary: 'Missed call about service.',
  },
  {
    serviceBookedId: 'booking-20',
    callerNumber: '+61400005684',
    callerName: 'Sophia Chen',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-21T18:00:00Z'),
    endAt: new Date('2024-03-21T18:30:00Z'),
    summary: 'Regular maintenance inquiry.',
  },
  {
    serviceBookedId: 'booking-21',
    callerNumber: '+61400009018',
    callerName: 'Thomas Anderson',
    status: CallLogStatus.FollowUp,
    startAt: new Date('2024-03-22T09:00:00Z'),
    summary: 'Request for urgent service.',
  },
  {
    serviceBookedId: 'booking-22',
    callerNumber: '+61400001241',
    callerName: 'Uma Patel',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-22T10:00:00Z'),
    endAt: new Date('2024-03-22T10:25:00Z'),
    summary: 'New service booking.',
  },
  {
    serviceBookedId: 'booking-23',
    callerNumber: '+61400005685',
    callerName: 'Victor Martinez',
    status: CallLogStatus.Missed,
    startAt: new Date('2024-03-22T11:00:00Z'),
    summary: 'Missed call about appointment.',
  },
  {
    serviceBookedId: 'booking-24',
    callerNumber: '+61400009019',
    callerName: 'Wendy Taylor',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-22T12:00:00Z'),
    endAt: new Date('2024-03-22T12:50:00Z'),
    summary: 'Service quality feedback.',
  },
  {
    serviceBookedId: 'booking-25',
    callerNumber: '+61400001242',
    callerName: 'Xavier Johnson',
    status: CallLogStatus.FollowUp,
    startAt: new Date('2024-03-22T13:00:00Z'),
    summary: 'Follow-up on previous service.',
  },
  {
    serviceBookedId: 'booking-26',
    callerNumber: '+61400005686',
    callerName: 'Yara Smith',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-22T14:00:00Z'),
    endAt: new Date('2024-03-22T14:35:00Z'),
    summary: 'Emergency service needed.',
  },
  {
    serviceBookedId: 'booking-27',
    callerNumber: '+61400009020',
    callerName: 'Zack Brown',
    status: CallLogStatus.Missed,
    startAt: new Date('2024-03-22T15:00:00Z'),
    summary: 'Missed call about pricing.',
  },
  {
    serviceBookedId: 'booking-28',
    callerNumber: '+61400001243',
    callerName: 'Amy Wilson',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-22T16:00:00Z'),
    endAt: new Date('2024-03-22T16:40:00Z'),
    summary: 'New customer inquiry.',
  },
  {
    serviceBookedId: 'booking-29',
    callerNumber: '+61400005687',
    callerName: 'Ben Davis',
    status: CallLogStatus.FollowUp,
    startAt: new Date('2024-03-22T17:00:00Z'),
    summary: 'Request for additional service.',
  },
  {
    serviceBookedId: 'booking-30',
    callerNumber: '+61400009021',
    callerName: 'Cathy Lee',
    status: CallLogStatus.Completed,
    startAt: new Date('2024-03-22T18:00:00Z'),
    endAt: new Date('2024-03-22T18:30:00Z'),
    summary: 'Regular maintenance booking.',
  }
];

export async function seedCallLogs(app: INestApplicationContext) {
  const calllogService = app.get(CalllogService);
  const userModel = app.get<Model<UserDocument>>('UserModel');
  
  console.log('📞 Seeding call logs...');
  
  // Get John Admin user from the database
  const johnAdmin = await userModel.findOne({ email: 'john.admin@example.com' }).exec();
  if (!johnAdmin) {
    console.error('❌ John Admin user not found in the database. Please run user seeding first.');
    return;
  }
  
  // Use John Admin's ID for all call logs
  const userId = (johnAdmin._id instanceof Types.ObjectId) ? johnAdmin._id.toString() : String(johnAdmin._id);
  
  for (const callLog of mockCallLogs) {
    try {
      await calllogService.create({
        ...callLog,
        userId,
      });
      console.log(`✅ Created call log for ${callLog.callerName}`);
    } catch (error) {
      console.error(`❌ Failed to create call log for ${callLog.callerName}:`, error);
    }
  }
  
  console.log('✅ Call logs seeding completed');
} 