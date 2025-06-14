// src/modules/blog/seed-data.ts

import { BlogDocument } from './schema/blog.schema';

export const initialBlogs: Partial<BlogDocument>[] = [
    {
        title:
            'New Dispatch.ai Features Update: Smarter Call Routing & Custom Notifications for Your Business',
        summary: `Why settle for missed calls and repetitive tasks? Dispatch.ai is now smarter, faster, and even more tailored for service professionals.`,
        content: `<h2>We're making Dispatch.ai even more powerful</h2>
              <p>At Dispatch.ai, we’re committed to transforming how service businesses handle calls and customer communication. Our latest update brings you more control and efficiency.</p>
              <p>But first, a quick milestone worth celebrating—last month, Dispatch.ai helped our clients manage over 400,000 service-related phone calls! 🎉</p>

              <h3>Smarter Call Routing, Custom FAQs & Better Web Integration</h3>
              <p>No more juggling phones during jobs or after hours. Dispatch.ai now includes:</p>
              <p>✅ Smart routing based on service type and business hours<p>
              <p>✅ Upload and manage large FAQ documents to automate common queries<p>
              <p>✅ Import FAQs from your business website—just paste the link<p>

              <p>💡 How it helps: Save time, reduce missed calls, and improve customer satisfaction—all while staying focused on the job.</p>`,
        author: 'Dispatch Team',
        date: new Date('2025-03-28'),
        tag: ['Small And Medium Businesses', 'Small Businesses'],
        videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
        imageUrl: '/detail-blog/sample.png',
        avatarUrl: '/detail-blog/avatars/logo-dark.svg',
    },
    {
        title:  'Automate Your Phone Support with Dispatch.ai',
        summary: 'Discover how Dispatch.ai helps contractors and small business owners handle customer calls effortlessly.',
        content: `<h2>Say goodbye to missed opportunities</h2>
                <p>Dispatch.ai is the AI-powered phone assistant built for trades and services. Whether you’re fixing a leak or managing multiple properties, Dispatch handles your calls like a pro.</p>
                <p>💡 Features like automated call answering, job scheduling, and customer callbacks are designed to save you hours every week.</p>`,
        author: 'Dispatch Team',
        date: new Date('2025-04-15'),
        tag: ['Small And Medium Businesses', 'Small Businesses'],
        videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
        imageUrl: '/detail-blog/sample.png',
        avatarUrl: '/detail-blog/avatars/logo-dark.svg',
    },
    {
        title: 'Why Rental Managers Love Dispatch.ai',
        summary: 'From urgent maintenance to tenant inquiries, Dispatch.ai keeps rental businesses running smoothly.',
        content: `<h2>Designed for property professionals</h2>
                <p>Rental managers juggle a lot—Dispatch.ai helps streamline calls, inquiries, and tenant requests without missing a beat.</p>
                <p>💡 Use custom call flows, voice messages, and AI responses to manage your workload like never before.</p>`,
        author: 'Dispatch Team',
        date: new Date('2025-04-15'),
        tag: ['Small Businesses'],
        videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
        imageUrl: '/detail-blog/sample.png',
        avatarUrl: '/detail-blog/avatars/logo-dark.svg',
    },
];
