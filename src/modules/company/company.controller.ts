import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Company } from './schema/company.schema';

@ApiTags('companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data or failed to create company.' })
  @ApiResponse({ status: 409, description: 'Company with this email already exists.' })
  async create(@Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'Return all companies.' })
  @ApiResponse({ status: 400, description: 'Failed to fetch companies.' })
  @ApiResponse({ status: 404, description: 'No companies found.' })
  async findAll(): Promise<Company[]> {
    return this.companyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by id' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Return the company.' })
  @ApiResponse({ status: 400, description: 'Invalid company ID format.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async findOne(@Param('id') id: string): Promise<Company> {
    return this.companyService.findOne(id);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get a company by email' })
  @ApiParam({ name: 'email', description: 'Company email' })
  @ApiResponse({ status: 200, description: 'Return the company.' })
  @ApiResponse({ status: 400, description: 'Email is required or invalid.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async findByUserEmail(@Param('email') email: string): Promise<Company> {
    return this.companyService.findByUserEmail(email);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid company ID format or update data.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  @ApiResponse({ status: 409, description: 'Company with this email already exists.' })
  async update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company successfully deleted.' })
  @ApiResponse({ status: 400, description: 'Invalid company ID format.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.companyService.remove(id);
  }
}
