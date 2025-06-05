import { Controller, Get, Param, Query } from '@nestjs/common';
import { DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';

import { BlogService } from './blog.service';
import { Blog } from './schema/blog.schema';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@ApiTags('Blogs')
@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) { }

  @Get()
  @ApiOkResponse({ description: 'Get all blogs', type: [Blog] })
  async findAll(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<PaginatedResponse<Blog>> {
    const [data, total] = await Promise.all([
      this.blogService.findAll(limit, page),
      this.blogService.countAll(),
    ]);
    return { data, total, page, limit };
  }

  @Get('search')
  @ApiOkResponse({ description: 'Search by keywords.', type: [Blog] })
  @ApiQuery({ name: 'keyword', required: true })
  async search(
    @Query('keyword') keyword: string,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('page', ParseIntPipe) page = 1,
  ): Promise<PaginatedResponse<Blog>> {
    const [data, total] = await Promise.all([
      this.blogService.searchByKeyword(keyword, limit, page),
      this.blogService.countSearchByKeyword(keyword),
    ]);
    return { data, total, page, limit };
  }

  @Get('tag/:tag')
  @ApiOkResponse({ description: 'Search by tags.', type: [Blog] })
  @ApiParam({ name: 'tag', required: true })
  async findByTag(
    @Param('tag') tag: string,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('page', ParseIntPipe) page = 1,
  ): Promise<PaginatedResponse<Blog>> {
    const [data, total] = await Promise.all([
      this.blogService.findByTag(tag, limit, page),
      this.blogService.countByTag(tag),
    ]);
    return { data, total, page, limit };
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Search by id.', type: Blog })
  @ApiParam({ name: 'id', required: true })
  async findById(@Param('id') id: string): Promise<Blog> {
    return this.blogService.getBlogDetail(id); //details
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Seed data inserted successfully',
    type: Object
  })
  async seedData(): Promise<{ message: string; insertedCount: number }> {
    const result = await this.blogService.seedInitialBlogs();
    return {
      message: 'Seed data inserted successfully',
      insertedCount: result.insertedCount,
    };
  }
}
