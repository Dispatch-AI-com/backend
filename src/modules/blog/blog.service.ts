import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

import { Blog, BlogDocument } from './schema/blog.schema';
import { initialBlogs } from './seed-data';
import { escapeForRegex, getYouTubeEmbedUrl } from './utils/blog-detail.helper';

export interface BlogDetail {
  _id: string;
  title: string;
  summary: string;
  content: string;
  tag: string[];
  date: Date;
  author: string;
  videoUrl?: string;
  imageUrl?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  videoEmbedUrl: string | null;
}

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name)
    private readonly blogModel: Model<BlogDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialBlogs();
  }

  // insert initial blogs into the database
  async seedInitialBlogs(): Promise<{ insertedCount: number }> {
    await this.blogModel.deleteMany({});
    const insertedDocs = await this.blogModel.insertMany(initialBlogs);
    return { insertedCount: insertedDocs.length };
  }

  // Combination search (keyword + topic/tag), or list all if no filter
  async searchBlogs(
    keyword?: string,
    tag?: string,
    limit = 9,
    page = 1,
  ): Promise<Blog[]> {
    const filter: FilterQuery<BlogDocument> = {};

    if (keyword != null && keyword !== '') {
      const safe = escapeForRegex(keyword);
      const regex = new RegExp(safe, 'i');
      filter.$or = [{ title: regex }, { summary: regex }];
    }

    if (tag != null && tag !== '') {
      const allowedTags = [
        'Small Businesses',
        'Small And Medium Businesses',
        'other',
      ];

      if (!allowedTags.includes(tag)) {
        throw new BadRequestException('Invalid tag value');
      }

      if (typeof tag !== 'string') {
        throw new BadRequestException('Tag must be a string');
      }
      const safeTag = tag;
      filter.tag = { $eq: safeTag };
    }

    return this.blogModel
      .find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();
  }

  // Count for combination search
  async countSearchBlogs(keyword?: string, tag?: string): Promise<number> {
    const filter: FilterQuery<BlogDocument> = {};

    if (keyword != null && keyword !== '') {
      const safe = escapeForRegex(keyword);
      const regex = new RegExp(safe, 'i');
      filter.$or = [{ title: regex }, { summary: regex }];
    }

    if (tag != null && tag !== '') {
      const allowedTags = [
        'Small Businesses',
        'Small And Medium Businesses',
        'other',
      ];

      if (!allowedTags.includes(tag)) {
        throw new BadRequestException('Invalid tag value');
      }

      if (typeof tag !== 'string') {
        throw new BadRequestException('Tag must be a string');
      }
      const safeTag = tag;
      filter.tag = { $eq: safeTag };
    }

    return this.blogModel.countDocuments(filter).exec();
  }

  // Get blog detail (lean object for frontend)
  async getBlogDetail(id: string): Promise<BlogDetail> {
    const blog = await this.blogModel.findById(id).lean().exec();

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    const {
      _id,
      title,
      summary,
      content,
      tag,
      date,
      author,
      videoUrl,
      imageUrl,
      avatarUrl,
      createdAt,
      updatedAt,
    } = blog;

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
      imageUrl,
      avatarUrl,
      createdAt,
      updatedAt,
      videoEmbedUrl: getYouTubeEmbedUrl(videoUrl),
    };
  }

  async getHighlightBlogs(limit: number): Promise<BlogDocument[]> {
    return this.blogModel.find().sort({ date: -1 }).limit(limit).exec();
  }
}
