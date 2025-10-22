import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { EUserRole } from '@/common/constants/user.constant';
import { Roles } from '@/common/decorators/roles.decorator';
import { CompanyOwnerGuard } from '@/common/guards/company-owner.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './schema/company.schema';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(AuthGuard('jwt'), RolesGuard, CompanyOwnerGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company successfully created.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or failed to create company.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid token.' })
  @ApiResponse({
    status: 409,
    description: 'Company with this email already exists.',
  })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @Req() req: any,
  ): Promise<Company> {
    // Associate the company with the authenticated user
    const companyData = {
      ...createCompanyDto,
      user: req.user._id,
    };
    return this.companyService.create(companyData);
  }

  @Get()
  @Roles(EUserRole.admin)
  @ApiOperation({
    summary: 'Get all companies (Admin only)',
    description: 'Retrieve a list of all companies. Only accessible by admin users.',
  })
  @ApiResponse({ status: 200, description: 'Return all companies.' })
  @ApiResponse({ status: 400, description: 'Failed to fetch companies.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid token.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin role.',
  })
  @ApiResponse({ status: 404, description: 'No companies found.' })
  async findAll(): Promise<Company[]> {
    return this.companyService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a company by id',
    description:
      'Retrieve a specific company by ID. Admin can access any company, users can only access their own company.',
  })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Return the company.' })
  @ApiResponse({ status: 400, description: 'Invalid company ID format.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid token.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to access this company.',
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async findOne(@Param('id') id: string): Promise<Company> {
    return this.companyService.findOne(id);
  }

  @Get('email/:email')
  @ApiOperation({
    summary: 'Get a company by email',
    description:
      'Retrieve a company by email. Admin can search any email, users can only search their own email.',
  })
  @ApiParam({ name: 'email', description: 'Company email' })
  @ApiResponse({ status: 200, description: 'Return the company.' })
  @ApiResponse({ status: 400, description: 'Email is required or invalid.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid token.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to access this company.',
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async findByUserEmail(@Param('email') email: string): Promise<Company> {
    return this.companyService.findByUserEmail(email);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a company',
    description:
      'Update a company by ID. Admin can update any company, users can only update their own company.',
  })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company successfully updated.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid company ID format or update data.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid token.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to update this company.',
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  @ApiResponse({
    status: 409,
    description: 'Company with this email already exists.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(EUserRole.admin)
  @ApiOperation({
    summary: 'Delete a company (Admin only)',
    description: 'Delete a company by ID. Only accessible by admin users.',
  })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company successfully deleted.' })
  @ApiResponse({ status: 400, description: 'Invalid company ID format.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid token.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin role.',
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.companyService.remove(id);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get a company by userId',
    description:
      'Retrieve a company by user ID. Admin can access any company, users can only access their own company.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Return the company.' })
  @ApiResponse({ status: 400, description: 'Invalid userId.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - No valid token.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to access this company.',
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async findByUserId(@Param('userId') userId: string): Promise<Company> {
    return this.companyService.findByUserId(userId);
  }
}
