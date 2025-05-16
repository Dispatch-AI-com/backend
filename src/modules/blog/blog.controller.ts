import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { Blog } from './schema/blog.schema';
import { ParseIntPipe } from '@nestjs/common';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async findAll(
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('page', ParseIntPipe) page = 1,
  ) {
    const [data, total] = await Promise.all([
      this.blogService.findAll(limit, page),
      this.blogService.countAll(),
    ]);
    return { data, total, page, limit };
  }

  @Get('search')
  async search(
    @Query('keyword') keyword: string,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('page', ParseIntPipe) page = 1,
  ) {
    const [data, total] = await Promise.all([
      this.blogService.searchByKeyword(keyword, limit, page),
      this.blogService.countSearchByKeyword(keyword),
    ]);
    return { data, total, page, limit };
  }

  @Get('tag/:tag')
  async findByTag(
    @Param('tag') tag: string,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('page', ParseIntPipe) page = 1,
  ) {
    const [data, total] = await Promise.all([
      this.blogService.findByTag(tag, limit, page),
      this.blogService.countByTag(tag),
    ]);
    return { data, total, page, limit };
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Blog> {
    return this.blogService.findById(id);
  }
}
