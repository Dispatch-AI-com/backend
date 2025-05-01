import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './schema/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
    constructor(
        @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    ) { }

    async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
        try {
            // Check if company with same email already exists
            const existingCompany = await this.companyModel.findOne({ email: createCompanyDto.email }).exec();
            if (existingCompany) {
                throw new ConflictException(`Company with email ${createCompanyDto.email} already exists`);
            }

            const createdCompany = new this.companyModel(createCompanyDto);
            return await createdCompany.save();
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException('Failed to create company: ' + error.message);
        }
    }

    async findAll(): Promise<Company[]> {
        try {
            const companies = await this.companyModel.find().populate('user').exec();
            if (!companies || companies.length === 0) {
                throw new NotFoundException('No companies found');
            }
            return companies;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to fetch companies: ' + error.message);
        }
    }

    async findOne(id: string): Promise<Company> {
        try {
            const company = await this.companyModel.findById(id).populate('user').exec();
            if (!company) {
                throw new NotFoundException(`Company with ID ${id} not found`);
            }
            return company;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Failed to fetch company: ' + error.message);
        }
    }

    async findByUserEmail(email: string): Promise<Company> {
        try {
            if (!email) {
                throw new BadRequestException('Email is required');
            }

            const company = await this.companyModel.findOne({ email }).populate('user').exec();
            if (!company) {
                throw new NotFoundException(`Company with email ${email} not found`);
            }
            return company;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to fetch company by email: ' + error.message);
        }
    }

    async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
        try {
            // If email is being updated, check for duplicates
            if (updateCompanyDto.email) {
                const existingCompany = await this.companyModel.findOne({
                    email: updateCompanyDto.email,
                    _id: { $ne: id }
                }).exec();

                if (existingCompany) {
                    throw new ConflictException(`Company with email ${updateCompanyDto.email} already exists`);
                }
            }

            const updatedCompany = await this.companyModel
                .findByIdAndUpdate(id, updateCompanyDto, {
                    new: true,
                    runValidators: true
                })
                .populate('user')
                .exec();

            if (!updatedCompany) {
                throw new NotFoundException(`Company with ID ${id} not found`);
            }
            return updatedCompany;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException('Failed to update company: ' + error.message);
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
            throw new BadRequestException('Failed to delete company: ' + error.message);
        }
    }
} 