import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './schema/company.schema';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    try {
      const existingCompany = await this.companyModel
        .findOne({ email: { $eq: createCompanyDto.email } })
        .exec();
      if (existingCompany) {
        throw new ConflictException(
          `Company with email ${createCompanyDto.email} already exists`,
        );
      }

      const createdCompany = new this.companyModel(createCompanyDto);
      return await createdCompany.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to create company: ' + (error as Error).message,
      );
    }
  }

  async findAll(): Promise<Company[]> {
    try {
      const companies = await this.companyModel.find().populate('user').exec();
      return companies;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to fetch companies: ' + (error as Error).message,
      );
    }
  }

  async findOne(id: string): Promise<Company> {
    try {
      const company = await this.companyModel
        .findById(id)
        .populate('user')
        .exec();
      if (!company) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }
      return company;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to fetch company: ' + (error as Error).message,
      );
    }
  }

  async findByUserEmail(email: string): Promise<Company> {
    try {
      if (email.trim() === '') {
        throw new BadRequestException('Email is required');
      }
      const company = await this.companyModel
        .findOne({ email })
        .populate('user')
        .exec();
      if (!company) {
        throw new NotFoundException(`Company with email ${email} not found`);
      }
      return company;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to fetch company by email: ' + (error as Error).message,
      );
    }
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid company ID format');
      }

      if (
        updateCompanyDto.email !== undefined &&
        updateCompanyDto.email.trim() !== ''
      ) {
        const existingCompany = await this.companyModel
          .findOne({
            email: { $eq: updateCompanyDto.email },
            _id: { $ne: new Types.ObjectId(id) },
          })
          .exec();

        if (existingCompany) {
          throw new ConflictException(
            `Company with email ${updateCompanyDto.email} already exists`,
          );
        }
      }

      const updateQuery = Object.entries(updateCompanyDto).reduce(
        (acc, [key, value]) => ({ ...acc, [key]: { $eq: value } }),
        {},
      );

      const updatedCompany = await this.companyModel
        .findByIdAndUpdate(
          new Types.ObjectId(id),
          { $set: updateQuery },
          {
            new: true,
            runValidators: true,
          },
        )
        .populate('user')
        .exec();

      if (!updatedCompany) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }
      return updatedCompany;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to update company: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.companyModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to delete company: ' + (error as Error).message,
      );
    }
  }

  async findByUserId(userId: string): Promise<Company> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      const company = await this.companyModel
        .findOne({ user: userId })
        .populate('user')
        .exec();
      if (!company) {
        throw new NotFoundException(`Company with user ID ${userId} not found`);
      }
      return company;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to fetch company by userId: ' + (error as Error).message,
      );
    }
  }

  /**
   * Find company by its unique Twilio phone number
   * @param twilioPhoneNumber The Twilio number assigned to the company (exact match)
   * @throws NotFoundException when no company is found
   * @throws BadRequestException when input is invalid or other db errors occur
   */
  async findByTwilioPhoneNumber(twilioPhoneNumber: string): Promise<Company> {
    try {
      if (!twilioPhoneNumber || twilioPhoneNumber.trim() === '') {
        throw new BadRequestException('Twilio phone number is required');
      }

      // validate E.164 style phone number (e.g. +61412345678)
      if (typeof twilioPhoneNumber !== 'string' || !/^\+?\d{6,15}$/.test(twilioPhoneNumber)) {
        throw new BadRequestException('Invalid Twilio phone number format');
      }

      const company = await this.companyModel
        .findOne({ twilioPhoneNumber: { $eq: twilioPhoneNumber } })
        .populate('user')
        .exec();

      if (!company) {
        throw new NotFoundException(
          `Company with Twilio number ${twilioPhoneNumber} not found`,
        );
      }

      return company;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to fetch company by Twilio number: ' + (error as Error).message,
      );
    }
  }
}
