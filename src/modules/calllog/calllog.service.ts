import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Error as MongooseError, Model, Types } from 'mongoose';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';

import { ICallLog, ICallLogResponse, ICallLogMetrics } from '@/common/interfaces/calllog';
import { CallLogStatus, DEFAULT_PAGE, DEFAULT_LIMIT, CALLLOG_SORT_OPTIONS } from '@/common/constants/calllog.constant';

import { Transcript } from '../transcript/schema/transcript.schema';
import { CreateCallLogDto } from './dto/create-calllog.dto';
import { UpdateCallLogDto } from './dto/update-calllog.dto';
import { CallLog, CallLogDocument } from './schema/calllog.schema';
import { sanitizeCallLogUpdate } from './utils/sanitize-update';
import { TranscriptService } from '../transcript/transcript.service';
import { TranscriptChunkService } from '../transcript-chunk/transcript-chunk.service';

interface FindAllOptions {
  companyId: string;
  status?: CallLogStatus;
  search?: string;
  startAtFrom?: string;
  startAtTo?: string;
  sort?: typeof CALLLOG_SORT_OPTIONS[keyof typeof CALLLOG_SORT_OPTIONS];
  page?: number;
  limit?: number;
}

@Injectable()
export class CalllogService {
  constructor(
    @InjectModel(CallLog.name)
    private readonly callLogModel: Model<CallLogDocument>,
    @InjectModel(Transcript.name)
    private readonly transcriptModel: Model<Transcript>,
    private readonly transcriptService: TranscriptService,
    private readonly transcriptChunkService: TranscriptChunkService,
  ) {}

  private convertToICallLog(doc: CallLogDocument): ICallLog {
    const obj = doc.toObject();
    return {
      ...obj,
      _id: obj._id.toString(),
    };
  }

  async create(dto: CreateCallLogDto): Promise<ICallLog> {
    try {
      const doc = await this.callLogModel.create(dto);
      return this.convertToICallLog(doc);
    } catch (error) {
      if (error instanceof MongooseError.ValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async findAll({
    companyId,
    status,
    search,
    startAtFrom,
    startAtTo,
    sort = CALLLOG_SORT_OPTIONS.NEWEST,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  }: FindAllOptions): Promise<ICallLogResponse> {
    const query: any = { companyId };

    if (status) {
      query.status = status;
    }

    if (search) {
      // Remove any non-alphanumeric characters from search term
      const cleanSearch = search.replace(/[^a-zA-Z0-9]/g, '');
      query.$or = [
        { callerNumber: { $regex: cleanSearch, $options: 'i' } },
        { serviceBookedId: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    if (startAtFrom || startAtTo) {
      query.startAt = {};
      if (startAtFrom) {
        query.startAt.$gte = new Date(startAtFrom);
      }
      if (startAtTo) {
        query.startAt.$lte = new Date(startAtTo);
      }
    }

    const sortOrder = sort === CALLLOG_SORT_OPTIONS.NEWEST ? -1 : 1;
    const skip = (page - 1) * limit;

    const [callLogs, total] = await Promise.all([
      this.callLogModel
        .find(query)
        .sort({ startAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.callLogModel.countDocuments(query),
    ]);

    return {
      data: callLogs.map(doc => this.convertToICallLog(doc)),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(companyId: string, calllogId: string): Promise<ICallLog> {
    try {
      const callLog = await this.callLogModel.findOne({
        _id: calllogId,
        companyId,
      });

      if (!callLog) {
        throw new NotFoundException(`Call log with ID ${calllogId} not found`);
      }

      return this.convertToICallLog(callLog);
    } catch (error) {
      if (error instanceof MongooseError.CastError && error.path === '_id') {
        throw new NotFoundException(`Call log with ID ${calllogId} not found`);
      }
      throw error;
    }
  }

  async getAudio(companyId: string, calllogId: string): Promise<string> {
    const callLog = await this.findOne(companyId, calllogId);
    
    if (!callLog.audioId) {
      throw new NotFoundException('No audio available for this call');
    }

    return callLog.audioId;
  }

  async getTodayMetrics(companyId: string): Promise<ICallLogMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalCalls, liveCalls] = await Promise.all([
      this.callLogModel.countDocuments({
        companyId,
        startAt: { $gte: today },
      }),
      this.callLogModel.countDocuments({
        companyId,
        startAt: { $gte: today },
        status: CallLogStatus.InProgress,
      }),
    ]);

    return {
      totalCalls,
      liveCalls,
    };
  }

  async update(
    companyId: string,
    calllogId: string,
    updateCallLogDto: UpdateCallLogDto,
  ): Promise<ICallLog> {
    try {
      const sanitizedUpdate = sanitizeCallLogUpdate(updateCallLogDto);
      const updatedCallLog = await this.callLogModel
        .findOneAndUpdate(
          { _id: calllogId, companyId },
          { $set: sanitizedUpdate },
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedCallLog) {
        throw new NotFoundException(`Call log with ID ${calllogId} not found`);
      }

      return this.convertToICallLog(updatedCallLog);
    } catch (error) {
      if (error instanceof MongooseError.ValidationError) {
        throw new BadRequestException(error.message);
      }
      if (
        error instanceof MongooseError.CastError &&
        error.path &&
        error.path === '_id'
      ) {
        throw new NotFoundException(`Call log with ID ${calllogId} not found`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<CallLogDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid calllog ID');
      }

      const calllog = await this.callLogModel.findById(id);
      if (!calllog) {
        throw new NotFoundException(`Calllog with ID ${id} not found`);
      }

      // Delete transcript and its chunks if they exist
      try {
        const transcript = await this.transcriptService.findByCallLogId(id);
        if (transcript) {
          // Delete chunks first
          await this.transcriptChunkService.deleteByTranscriptId(transcript._id.toString());
          // Then delete transcript
          await this.transcriptService.deleteByCallLogId(id);
        }
      } catch (error) {
        // If transcript doesn't exist, that's fine
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }

      // Finally delete the calllog
      const deleted = await this.callLogModel.findByIdAndDelete(id);
      if (!deleted) {
        throw new NotFoundException(`Calllog with ID ${id} not found`);
      }

      return deleted;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Calllog with ID ${id} not found`);
    }
  }
}
