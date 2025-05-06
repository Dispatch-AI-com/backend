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
}
