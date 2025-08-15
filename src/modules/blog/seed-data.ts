// src/modules/blog/seed-data.ts

import type { BlogDocument } from './schema/blog.schema';

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
    title: 'Automate Your Phone Support with Dispatch.ai',
    summary:
      'Discover how Dispatch.ai helps contractors and small business owners handle customer calls effortlessly.',
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
    summary:
      'From urgent maintenance to tenant inquiries, Dispatch.ai keeps rental businesses running smoothly.',
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
  {
    title: 'Boost Customer Satisfaction with Dispatch.ai Call Insights',
    summary: 'Learn how to track and improve every customer interaction.',
    content: `<h2>Data-driven service improvement</h2>
              <p>Dispatch.ai now provides call analytics so you can see patterns and improve performance.</p>`,
    author: 'Dispatch Team',
    date: new Date('2025-04-20'),
    tag: ['Small Businesses'],
    videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
    imageUrl: '/detail-blog/sample.png',
    avatarUrl: '/detail-blog/avatars/logo-dark.svg',
  },
  {
    title: 'Five Ways Dispatch.ai Saves Time for Plumbers and Electricians',
    summary: 'From job scheduling to instant quotes—save hours every week.',
    content: `<h2>Focus on the work that matters</h2>
              <p>Dispatch.ai handles the admin while you focus on getting the job done.</p>`,
    author: 'Dispatch Team',
    date: new Date('2025-04-22'),
    tag: ['Small And Medium Businesses'],
    videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
    imageUrl: '/detail-blog/sample.png',
    avatarUrl: '/detail-blog/avatars/logo-dark.svg',
  },
  {
    title: 'Never Miss a Lead Again with Dispatch.ai’s After-Hours Answering',
    summary: 'Capture leads even when your business is closed.',
    content: `<h2>Stay connected 24/7</h2>
              <p>Our AI answers calls after hours and schedules follow-ups automatically.</p>`,
    author: 'Dispatch Team',
    date: new Date('2025-04-25'),
    tag: ['Small Businesses', 'Small And Medium Businesses'],
    videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
    imageUrl: '/detail-blog/sample.png',
    avatarUrl: '/detail-blog/avatars/logo-dark.svg',
  },
  {
    title: 'Dispatch.ai Helps Cleaning Services Book More Jobs',
    summary: 'Automated booking and reminders keep your calendar full.',
    content: `<h2>Let AI manage your schedule</h2>
              <p>No more missed bookings—Dispatch.ai keeps customers on track.</p>`,
    author: 'Dispatch Team',
    date: new Date('2025-04-28'),
    tag: ['Small Businesses'],
    videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
    imageUrl: '/detail-blog/sample.png',
    avatarUrl: '/detail-blog/avatars/logo-dark.svg',
  },
  {
    title: 'The Ultimate Guide to AI in Field Service Businesses',
    summary: 'Everything you need to know to get started with AI tools.',
    content: `<h2>Transform your workflow</h2>
              <p>AI can take your service business to the next level—here’s how.</p>`,
    author: 'Dispatch Team',
    date: new Date('2025-05-01'),
    tag: ['Small And Medium Businesses'],
    videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
    imageUrl: '/detail-blog/sample.png',
    avatarUrl: '/detail-blog/avatars/logo-dark.svg',
  },
  {
    title: 'Reduce Cancellations with Dispatch.ai Appointment Reminders',
    summary: 'SMS and call reminders keep customers committed.',
    content: `<h2>Fewer no-shows, more revenue</h2>
              <p>Automated reminders help reduce cancellations by up to 40%.</p>`,
    author: 'Dispatch Team',
    date: new Date('2025-05-03'),
    tag: ['Small Businesses', 'Small And Medium Businesses'],
    videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
    imageUrl: '/detail-blog/sample.png',
    avatarUrl: '/detail-blog/avatars/logo-dark.svg',
  },
  {
    title: 'How Dispatch.ai Integrates with Your Existing Tools',
    summary: 'Seamlessly connect with your CRM, calendar, and payment systems.',
    content: `<h2>One hub for all your business tools</h2>
              <p>Integration makes your workflow smoother than ever.</p>`,
    author: 'Dispatch Team',
    date: new Date('2025-05-06'),
    tag: ['Small Businesses'],
    videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
    imageUrl: '/detail-blog/sample.png',
    avatarUrl: '/detail-blog/avatars/logo-dark.svg',
  },
  {
    title: 'Dispatch.ai Helps Landscapers Manage Seasonal Demand',
    summary: 'Stay ahead of peak seasons with smart call management.',
    content: `<h2>Maximize your busy months</h2>
              <p>Our AI ensures no lead slips through during high demand.</p>`,
    author: 'Dispatch Team',
    date: new Date('2025-05-08'),
    tag: ['Small And Medium Businesses'],
    videoUrl: 'https://youtu.be/JGxkFwvbwT0?si=KixY4pWX0lreijjN',
    imageUrl: '/detail-blog/sample.png',
    avatarUrl: '/detail-blog/avatars/logo-dark.svg',
  },
];
