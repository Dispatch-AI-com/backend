import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateCallLogDto } from './dto/create-calllog.dto';
import { UpdateCallLogDto } from './dto/update-calllog.dto';
import { CallLog, CallLogDocument } from './schema/calllog.schema';

@Injectable()
export class CalllogService {
  constructor(
    @InjectModel(CallLog.name)
    private readonly callLogModel: Model<CallLogDocument>,
  ) {}

  async create(dto: CreateCallLogDto): Promise<CallLog> {
    return this.callLogModel.create(dto);
  }

  async findAll(): Promise<CallLog[]> {
    return this.callLogModel.find().sort({ startAt: -1 }).exec();
  }

  async findByCompanyId(companyId: string): Promise<CallLog[]> {
    const callLogs = await this.callLogModel
      .find({ companyId })
      .sort({ startAt: -1 })
      .exec();

    if (callLogs.length === 0) {
      throw new NotFoundException(
        `No call logs found for company ID: ${companyId}`,
      );
    }

    return callLogs;
  }

  async findByStartAt(startDate: Date, endDate: Date): Promise<CallLog[]> {
    const callLogs = await this.callLogModel
      .find({
        startAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ startAt: -1 })
      .exec();

    if (callLogs.length === 0) {
      throw new NotFoundException(
        `No call logs found between ${startDate.toISOString()} and ${endDate.toISOString()}`,
      );
    }

    return callLogs;
  }

  async update(
    id: string,
    updateCallLogDto: UpdateCallLogDto,
  ): Promise<CallLog> {
    const updatedCallLog = await this.callLogModel
      .findByIdAndUpdate(
        id,
        { $set: updateCallLogDto },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedCallLog) {
      throw new NotFoundException(`Call log with ID ${id} not found`);
    }

    return updatedCallLog;
  }
}
