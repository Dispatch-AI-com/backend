import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog, BlogDocument } from './schema/blog.schema';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name)
    private readonly blogModel: Model<BlogDocument>,
  ) {}

  async findAll(limit: number, page: number): Promise<Blog[]> {
    return this.blogModel
      .find()
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async searchByKeyword(keyword: string, limit: number, page: number): Promise<Blog[]> {
    const regex = new RegExp(keyword, 'i');
    const blogs = await this.blogModel
      .find({
        $or: [{ title: regex }, { summary: regex }],
      })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    if (blogs.length === 0) {
      throw new NotFoundException(`No blogs found matching: ${keyword}`);
    }

    return blogs;
  }

  async findById(id: string): Promise<Blog> {
    const blog = await this.blogModel.findById(id).exec();

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    return blog;
  }

  async findByTag(tag: string, limit: number, page: number): Promise<Blog[]> {
    const blogs = await this.blogModel
      .find({ tag })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    if (blogs.length === 0) {
      throw new NotFoundException(`No blogs found with tag: ${tag}`);
    }
    return blogs;
  }

    async countAll(): Promise<number> {
      return this.blogModel.countDocuments().exec();
    }

    async countSearchByKeyword(keyword: string): Promise<number> {
      const regex = new RegExp(keyword, 'i');
      return this.blogModel.countDocuments({
          $or: [{ title: regex }, { summary: regex }],
      }).exec();
    }

    async countByTag(tag: string): Promise<number> {
      return this.blogModel.countDocuments({ tag }).exec();
    }
}