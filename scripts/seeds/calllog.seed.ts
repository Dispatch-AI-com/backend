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