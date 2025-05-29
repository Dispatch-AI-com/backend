import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Blog, BlogDocument } from './schema/blog.schema';

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
  createdAt: Date;
  updatedAt: Date;
  videoEmbedUrl: string | null;
}




@Injectable()
export class BlogService implements OnModuleInit {
  constructor(
    @InjectModel(Blog.name)
    private readonly blogModel: Model<BlogDocument>,
  ) { }

  async onModuleInit(): Promise<void> {
    const count = await this.blogModel.countDocuments();
    if (count === 0) {
      await this.blogModel.create({
        title:
          'New Lucy Features Update: Enhanced FAQs & Get Call Notifications Your Way',
        summary: `Why limit your customer experience to just one language? When all the important people in your life...`,
        content: `<h2>We're making Lucy even more efficient</h2>
                <p>As you know, we’re always working to make Lucy, our AI phone answering experience even better...</p>
                <p>But first, a quick milestone worth celebrating—last month, Lucy processed 400,000 phone calls! 🎉</p>

                <h3>Enhanced FAQs, Load Larger Documents & Webpages</h3>
                <p>Manually copying and pasting FAQs is a thing of the past...</p>

                <ul>
                  <li>✅ Upload significantly larger FAQ documents</li>
                  <li>✅ Import FAQs from a webpage—just paste the link</li>
                  <li>✅ Easier manual entry—copy and paste into a single document</li>
                </ul>

                <p>💡 How it helps: Instead of spending time manually inputting FAQ responses...</p>`,
        author: 'Jone',
        date: '2025/03/28',
        tag: ['Small And Medium Businesses', 'Small Businesses'],
        videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
      });
    }
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