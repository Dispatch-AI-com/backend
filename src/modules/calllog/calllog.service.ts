import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CallLog } from './schema/calllog.schema';
import { CreateCallLogDto } from './dto/create-calllog.dto';

@Injectable()
export class CalllogService {
  constructor(
    @InjectModel(CallLog.name) private readonly callLogModel: Model<CallLog>,
  ) {}

  async create(dto: CreateCallLogDto): Promise<CallLog> {
    const created = new this.callLogModel(dto);
    return created.save();
  }

  async findAll(): Promise<CallLog[]> {
    return this.callLogModel.find().sort({ startAt: -1 }).exec();
  }

  async findByCompanyId(companyId: string): Promise<CallLog[]> {
    return this.callLogModel
      .find({ companyId })
      .sort({ startAt: -1 })
      .exec();
  }

  async findByStartAt(startDate: Date, endDate: Date): Promise<CallLog[]> {
    return this.callLogModel
      .find({
        startAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ startAt: -1 })
      .exec();
  }
}
