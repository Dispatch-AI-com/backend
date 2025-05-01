import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('companies')
@Controller('companies')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new company' })
    @ApiResponse({ status: 201, description: 'Company successfully created.' })
    @ApiResponse({ status: 400, description: 'Invalid input data or failed to create company.' })
    @ApiResponse({ status: 409, description: 'Company with this email already exists.' })
    create(@Body() createCompanyDto: CreateCompanyDto) {
        return this.companyService.create(createCompanyDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all companies' })
    @ApiResponse({ status: 200, description: 'Return all companies.' })
    @ApiResponse({ status: 400, description: 'Failed to fetch companies.' })
    @ApiResponse({ status: 404, description: 'No companies found.' })
    findAll() {
        return this.companyService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a company by id' })
    @ApiParam({ name: 'id', description: 'Company ID' })
    @ApiResponse({ status: 200, description: 'Return the company.' })
    @ApiResponse({ status: 400, description: 'Invalid company ID format.' })
    @ApiResponse({ status: 404, description: 'Company not found.' })
    findOne(@Param('id') id: string) {
        return this.companyService.findOne(id);
    }

    @Get('email/:email')
    @ApiOperation({ summary: 'Get a company by email' })
    @ApiParam({ name: 'email', description: 'Company email' })
    @ApiResponse({ status: 200, description: 'Return the company.' })
    @ApiResponse({ status: 400, description: 'Email is required or invalid.' })
    @ApiResponse({ status: 404, description: 'Company not found.' })
    findByEmail(@Param('email') email: string) {
        return this.companyService.findByUserEmail(email);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a company' })
    @ApiParam({ name: 'id', description: 'Company ID' })
    @ApiResponse({ status: 200, description: 'Company successfully updated.' })
    @ApiResponse({ status: 400, description: 'Invalid company ID format or update data.' })
    @ApiResponse({ status: 404, description: 'Company not found.' })
    @ApiResponse({ status: 409, description: 'Company with this email already exists.' })
    update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
        return this.companyService.update(id, updateCompanyDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a company' })
    @ApiParam({ name: 'id', description: 'Company ID' })
    @ApiResponse({ status: 200, description: 'Company successfully deleted.' })
    @ApiResponse({ status: 400, description: 'Invalid company ID format.' })
    @ApiResponse({ status: 404, description: 'Company not found.' })
    remove(@Param('id') id: string) {
        return this.companyService.remove(id);
    }
} 