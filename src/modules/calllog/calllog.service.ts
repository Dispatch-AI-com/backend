import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Error as MongooseError, Model, Types } from 'mongoose';

import { CreateCallLogDto } from './dto/create-calllog.dto';
import { UpdateCallLogDto } from './dto/update-calllog.dto';
import { CallLog, CallLogDocument } from './schema/calllog.schema';
import { sanitizeCallLogUpdate } from './utils/sanitize-update';
import { TranscriptService } from '../transcript/transcript.service';
import { Transcript } from '../transcript/schema/transcript.schema';

@Injectable()
export class CalllogService {
  constructor(
    @InjectModel(CallLog.name)
    private readonly callLogModel: Model<CallLogDocument>,
    private readonly transcriptService: TranscriptService,
  ) {}

  async create(dto: CreateCallLogDto): Promise<CallLog> {
    try {
      return await this.callLogModel.create(dto);
    } catch (error) {
      if (error instanceof MongooseError.ValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
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

    return callLogs;
  }

  async update(
    id: string,
    updateCallLogDto: UpdateCallLogDto,
  ): Promise<CallLog> {
    try {
      const sanitizedUpdate = sanitizeCallLogUpdate(updateCallLogDto);
      const updatedCallLog = await this.callLogModel
        .findByIdAndUpdate(
          id,
          { $set: sanitizedUpdate },
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedCallLog) {
        throw new NotFoundException(`Call log with ID ${id} not found`);
      }

      return updatedCallLog;
    } catch (error) {
      if (error instanceof MongooseError.ValidationError) {
        throw new BadRequestException(error.message);
      }
      if (
        error instanceof MongooseError.CastError &&
        error.path &&
        error.path === '_id'
      ) {
        throw new NotFoundException(`Call log with ID ${id} not found`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<CallLog> {
    try {
      // First find the call log to ensure it exists
      const callLog = await this.callLogModel.findById(id);
      if (!callLog) {
        throw new NotFoundException(`Call log with ID ${id} not found`);
      }

      // Delete all related transcripts
      const transcripts = await this.transcriptService.findByCalllogId(id) as (Transcript & { _id: Types.ObjectId })[];
      for (const transcript of transcripts) {
        await this.transcriptService.delete(transcript._id.toString());
      }

      // Delete the call log
      const deleted = await this.callLogModel.findByIdAndDelete(id);
      if (!deleted) {
        throw new NotFoundException(`Call log with ID ${id} not found`);
      }
      return deleted;
    } catch (error) {
      if (error instanceof MongooseError.CastError && error.path === '_id') {
        throw new NotFoundException(`Call log with ID ${id} not found`);
      }
      throw error;
    }
  }
}
