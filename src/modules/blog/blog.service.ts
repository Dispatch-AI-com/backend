import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Blog, BlogDocument } from './schema/blog.schema';

import { escapeForRegex, getYouTubeEmbedUrl } from './utils/blog-detail.helper';

import { initialBlogs } from './seed-data';

export interface BlogDetail {
  _id: string;
  title: string;
  summary: string;
  content: string;
  tag: string[];
  date: Date;
  author: string;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  videoEmbedUrl: string | null;
}




@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name)
    private readonly blogModel: Model<BlogDocument>,
  ) { }

  // insert initial blogs into the database
  async seedInitialBlogs(): Promise<{ insertedCount: number }> {
    await this.blogModel.deleteMany({});
    const insertedDocs = await this.blogModel.insertMany(initialBlogs);
    return { insertedCount: insertedDocs.length };
  }

  async findAll(limit: number, page: number): Promise<Blog[]> {
    return this.blogModel
      .find()
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async searchByKeyword(
    keyword: string,
    limit: number,
    page: number,
  ): Promise<Blog[]> {
    const escapeRegex = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegex, 'i');
    const blogs = await this.blogModel
      .find({
        $or: [{ title: regex }, { summary: regex }],
      })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return blogs;
  }

  async findById(id: string): Promise<BlogDocument> {
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

    return blogs;
  }

  async countAll(): Promise<number> {
    return this.blogModel.countDocuments().exec();
  }

  async countSearchByKeyword(keyword: string): Promise<number> {
    const safe = escapeForRegex(keyword);
    const regex = new RegExp(safe, 'i');
    return this.blogModel
      .countDocuments({
        $or: [{ title: regex }, { summary: regex }],
      })
      .exec();
  }

  async countByTag(tag: string): Promise<number> {
    return this.blogModel.countDocuments({ tag }).exec();
  }

  async getBlogDetail(id: string): Promise<BlogDetail> {
    const blog = await this.blogModel.findById(id).lean().exec();
    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    const { _id, title, summary, content, tag, date, author, videoUrl, createdAt, updatedAt } = blog;

    if (createdAt == null || updatedAt == null) {
      throw new NotFoundException(`Timestamps missing for blog ${id}`);
    }

    return {
      _id: _id.toString(),
      title,
      summary,
      content,
      tag,
      date,
      author,
      videoUrl,
      createdAt,
      updatedAt,
      videoEmbedUrl: getYouTubeEmbedUrl(videoUrl),
    };
  }
}