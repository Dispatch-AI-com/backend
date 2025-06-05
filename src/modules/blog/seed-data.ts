// src/modules/blog/seed-data.ts

import { BlogDocument } from './schema/blog.schema';

export const initialBlogs: Partial<BlogDocument>[] = [
    {
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
        date: new Date('2025-03-28'),
        tag: ['Small And Medium Businesses', 'Small Businesses'],
        videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
        imageUrl: '/detail-blog/sample.jpg',
        avatarUrl: '/detail-blog/avatars/logo-dark.svg',
    },
    {
        title: 'second blog',
        summary: 'second blog summary',
        content: `<h2>the second blog</h2>
              <p>💡 the second blog</p>`,
        author: 'Alice',
        date: new Date('2025-04-15'),
        tag: ['Small And Medium Businesses', 'Small Businesses'],
        videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
        imageUrl: '/detail-blog/sample.jpg',
        avatarUrl: '/detail-blog/avatars/logo-dark.svg',
    },
];
