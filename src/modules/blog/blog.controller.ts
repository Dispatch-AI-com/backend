import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { BlogService } from './blog.service';
import { BlogDetail } from './blog.service';
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
  constructor(private readonly blogService: BlogService) {}

  @Get('search')
  @ApiOkResponse({
    description: 'Search blogs (by keyword and/or tag)',
    type: [Blog],
  })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'topic', required: false }) // 前端用 topic
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  async searchBlogs(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('keyword') keyword?: string,
    @Query('topic') topic?: string,
  ): Promise<PaginatedResponse<Blog>> {
    const [data, total] = await Promise.all([
      this.blogService.searchBlogs(keyword, topic, limit, page),
      this.blogService.countSearchBlogs(keyword, topic),
    ]);
    return { data, total, page, limit };
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Get blog detail by id.', type: Blog })
  @ApiParam({ name: 'id', required: true })
  async getBlogDetail(@Param('id') id: string): Promise<BlogDetail> {
    return this.blogService.getBlogDetail(id);
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Seed data inserted successfully',
    type: Object,
  })
  async seedData(): Promise<{ message: string; insertedCount: number }> {
    const result = await this.blogService.seedInitialBlogs();
    return {
      message: 'Seed data inserted successfully',
      insertedCount: result.insertedCount,
    };
  }
}
