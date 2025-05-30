import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Error as MongooseError, Model, Types } from 'mongoose';

import {
  CALLLOG_SORT_OPTIONS,
  CallLogStatus,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@/common/constants/calllog.constant';
import {
  ICallLog,
  ICallLogMetrics,
  ICallLogResponse,
} from '@/common/interfaces/calllog';

import { Transcript } from '../transcript/schema/transcript.schema';
import { TranscriptService } from '../transcript/transcript.service';
import { TranscriptChunkService } from '../transcript-chunk/transcript-chunk.service';
import { CreateCallLogDto } from './dto/create-calllog.dto';
import { UpdateCallLogDto } from './dto/update-calllog.dto';
import { CallLog, CallLogDocument } from './schema/calllog.schema';
import { sanitizeCallLogUpdate } from './utils/sanitize-update';

interface FindAllOptions {
  companyId: string;
  status?: CallLogStatus;
  search?: string;
  startAtFrom?: string;
  startAtTo?: string;
  sort?: (typeof CALLLOG_SORT_OPTIONS)[keyof typeof CALLLOG_SORT_OPTIONS];
  page?: number;
  limit?: number;
}

interface CallLogQuery {
  companyId: string;
  status?: CallLogStatus;
  startAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  $or?: {
    callerNumber?: { $regex: string; $options: string };
    serviceBookedId?: { $regex: string; $options: string };
  }[];
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
    const query: CallLogQuery = { companyId };

    if (status !== undefined) {
      if (!Object.values(CallLogStatus).includes(status)) {
        throw new BadRequestException(`Invalid status value: ${status}`);
      }
      query.status = { $eq: status };
    }

    if (search !== undefined && search !== '') {
      // Remove any non-alphanumeric characters from search term
      const cleanSearch = search.replace(/[^a-zA-Z0-9]/g, '');
      query.$or = [
        { callerNumber: { $regex: cleanSearch, $options: 'i' } },
        { serviceBookedId: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    if (startAtFrom !== undefined || startAtTo !== undefined) {
      query.startAt = {};
      if (startAtFrom !== undefined && startAtFrom !== '') {
        query.startAt.$gte = new Date(startAtFrom);
      }
      if (startAtTo !== undefined && startAtTo !== '') {
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

    if (callLog.audioId === undefined || callLog.audioId === '') {
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
        // Delete chunks first
        await this.transcriptChunkService.deleteByTranscriptId(
          transcript._id.toString(),
        );
        // Then delete transcript
        await this.transcriptService.deleteByCallLogId(id);
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
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new NotFoundException(`Calllog with ID ${id} not found`);
    }
  }

  private convertToICallLog(doc: CallLogDocument): ICallLog {
    const obj = doc.toObject();
    return Object.assign({}, obj, {
      _id: obj._id.toString(),
    });
  }
}
