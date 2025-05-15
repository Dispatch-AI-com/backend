import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
        .findOne({ email: createCompanyDto.email })
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
      if (companies.length === 0) {
        return [];
      }
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
      if (updateCompanyDto.email?.trim() !== '') {
        const existingCompany = await this.companyModel
          .findOne({
            email: updateCompanyDto.email,
            _id: { $ne: id },
          })
          .exec();

        if (existingCompany && updateCompanyDto.email) {
          throw new ConflictException(
            `Company with email ${updateCompanyDto.email} already exists`,
          );
        }
      }
      const updatedCompany = await this.companyModel
        .findByIdAndUpdate(id, updateCompanyDto, {
          new: true,
          runValidators: true,
        })
        .populate('user')
        .exec();
      if (!updatedCompany) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }
      return updatedCompany;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
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
}
