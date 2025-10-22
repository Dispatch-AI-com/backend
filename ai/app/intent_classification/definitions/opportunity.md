# OPPORTUNITY Intent Definition

## Overview
Legitimate opportunities for international students, including job interviews, employment offers, research positions, internships, and other career/academic opportunities that require timely response and coordination.

## Description
This intent identifies genuine opportunities (non-scam) that international students should consider and respond to. These include job interviews, employment opportunities, research collaborations, internships, networking events, and other legitimate professional/academic engagements. The system will help students capture these opportunities by collecting their availability, contact information, or scheduling follow-up actions.

## Characteristics

- Mentions of **job interviews** or interview invitations
- **Employment opportunities** or job offers
- **Research opportunities** or academic collaborations
- **Internship** positions or traineeships
- **Networking events** or professional meetups
- **Career fairs** or recruitment events
- **Scholarship** or fellowship opportunities
- **Academic presentations** or conference invitations
- Requests for **availability** to schedule important meetings
- Legitimate requests for **contact information** to follow up on opportunities
- Questions about student's **skills, qualifications, or experience**
- Offers of **mentorship** or professional guidance
- Invitations to **workshops** or professional development events

## Positive Examples

These messages **SHOULD** be classified as OPPORTUNITY:

1. "We'd like to invite you for a job interview next week. When are you available?"
2. "Our company has an internship position available. Are you interested in applying?"
3. "I'm a professor looking for research assistants. Would you like to discuss this opportunity?"
4. "There's a career fair on campus next Friday. Can we schedule a time to meet?"
5. "We received your application and would like to schedule an interview. What times work for you?"
6. "Our startup is hiring international students. Can we send you more information?"
7. "I'm organizing a networking event for tech professionals. Would you like to attend?"
8. "We have a scholarship opportunity for international students. Are you interested?"
9. "Our lab is looking for graduate research assistants. Can we set up a meeting?"
10. "There's an internship opening in our marketing department. When can we talk?"
11. "We're hosting a workshop on career development. Would you like to join?"
12. "I'd like to discuss a potential research collaboration. What's your email address?"
13. "Our company is recruiting for entry-level positions. When are you free to chat?"
14. "We have a mentorship program for international students. Are you interested?"
15. "There's a conference next month where we're presenting. Would you like to participate?"

## Negative Examples

These messages should **NOT** be classified as OPPORTUNITY:

1. "Transfer money immediately for a job offer" → SCAM (requires payment)
2. "You won a lottery prize, pay processing fee to claim" → SCAM (advance fee fraud)
3. "What are your office hours?" → FAQ (simple information request)
4. "I'd like to leave a message" → OTHER (message leaving request)
5. "Can someone call me back?" → OTHER (callback request)
6. "I have a complex visa situation" → OTHER (complex personal matter)
7. "Send your bank details for salary advance" → SCAM (requests sensitive info)
8. "Pay $500 to secure this job position" → SCAM (advance fee)

## Keywords

interview, job interview, employment, job opportunity, job offer, hiring, recruitment, recruiting, career, internship, intern position, research opportunity, research assistant, RA position, PhD opportunity, scholarship, fellowship, grant, mentorship, mentor, networking event, career fair, job fair, recruitment event, workshop, seminar, conference, presentation, collaboration, research collaboration, academic opportunity, professional development, trainee, traineeship, available, availability, when are you free, schedule, meeting, discuss opportunity, send information, contact information, email address, phone number, skills, qualifications, experience, CV, resume, application, interested, apply, position available, opening, vacancy

## Classification Rules

### High Confidence (>0.85)
- Clear mention of interviews, job offers, or research positions
- Explicit opportunity language combined with request for availability/contact info
- Legitimate professional/academic context
- No requests for money or sensitive financial information

### Medium Confidence (0.70-0.85)
- Mentions opportunities but context is somewhat vague
- Could be legitimate opportunity or general inquiry
- Needs clarification but likely genuine

### Low Confidence (<0.70)
- Ambiguous message that could be opportunity or something else
- If unclear → classify as OTHER for human review

## Important Distinctions

### OPPORTUNITY vs SCAM

**OPPORTUNITY** characteristics:
- ✅ Legitimate professional/academic context
- ✅ Focuses on student's skills, availability, or interests
- ✅ May ask for CV, contact info, or availability
- ✅ Does NOT request money upfront
- ✅ Does NOT request sensitive financial information (bank details, passwords)
- ✅ Professional language and context
- ✅ Reasonable timeline for response

**SCAM** characteristics:
- ❌ Requests money or payment
- ❌ Requests bank details, passwords, or credit card info
- ❌ Threatens negative consequences if don't comply
- ❌ Too good to be true (guaranteed high salary, lottery winnings)
- ❌ Requires gift cards or wire transfers
- ❌ High-pressure tactics or urgency without legitimate context

### OPPORTUNITY vs FAQ

**OPPORTUNITY** involves:
- 🎯 Specific opportunities requiring action
- 🎯 Requests for availability or contact information
- 🎯 Follow-up needed to pursue the opportunity
- 🎯 Time-sensitive engagement

**FAQ** involves:
- 📋 General information requests
- 📋 Standard questions with factual answers
- 📋 No specific opportunity or action required

### OPPORTUNITY vs OTHER

**OPPORTUNITY** is for:
- 🎯 Legitimate job, research, or academic opportunities
- 🎯 Professional development engagements
- 🎯 Career advancement possibilities

**OTHER** is for:
- 💬 General message leaving
- 💬 Callback requests without opportunity context
- 💬 Complex personal situations unrelated to opportunities
- 💬 Administrative or general inquiries

### Examples of the Distinction

| Message | Intent | Reason |
|---------|--------|--------|
| "We'd like to interview you for a position" | OPPORTUNITY | Legitimate interview invitation |
| "Pay $500 to secure your job interview" | SCAM | Requires payment |
| "What are your office hours?" | FAQ | General information |
| "Can someone call me back?" | OTHER | General callback request |
| "Our lab is hiring research assistants, interested?" | OPPORTUNITY | Legitimate research position |
| "You won a scholarship, send bank details to claim" | SCAM | Requests sensitive info |
| "I'd like to leave a message" | OTHER | Message leaving |
| "We have an internship opening, when are you available?" | OPPORTUNITY | Legitimate internship + availability request |

## Action on Detection

When OPPORTUNITY intent is detected:

1. **Acknowledge the opportunity**
   - Thank the caller for reaching out
   - Confirm interest in the opportunity

2. **Collect necessary information**
   - Student's availability (times/dates they're free)
   - Preferred contact method (email, phone)
   - Email address for sending details
   - Phone number if needed
   - Any specific preferences or requirements

3. **Provide confirmation**
   - Summarize what information was collected
   - Confirm next steps
   - Set expectations for follow-up

4. **Store and route appropriately**
   - Save opportunity details and student response
   - Flag as high priority for student review
   - Send notification to student about the opportunity
   - Enable student to confirm/decline/reschedule

5. **Safety check**
   - Verify legitimacy (no red flags indicating scam)
   - If any suspicious elements detected → escalate to human review
   - Better to be cautious than miss a scam disguised as opportunity

## Follow-up Workflow

### For Interview Invitations:
1. Collect: Available dates/times, preferred interview format (phone/video/in-person), contact email
2. Confirm: Interview details received, student will be contacted
3. Action: Send confirmation email with details to student

### For Job/Research Opportunities:
1. Collect: Interest level, availability to discuss, CV/resume if needed, email for details
2. Confirm: Information received, details will be sent
3. Action: Connect student with opportunity provider

### For Events (Career Fairs, Workshops):
1. Collect: Interest in attending, availability, contact for event details
2. Confirm: Registration noted or details will be sent
3. Action: Add to student's calendar, send event information

## Edge Cases

### Borderline Cases (Opportunity vs Scam):
- "We have a job for you, just pay training fee" → **SCAM** (requires payment)
- "Interview opportunity, deposit required to secure slot" → **SCAM** (requires deposit)
- "Internship available, but you need to buy equipment" → **SCAM** (requires purchase)
- When in doubt about legitimacy → classify as **OTHER** for human verification

### Borderline Cases (Opportunity vs Other):
- "Can we schedule a meeting?" (no context) → **OTHER** (unclear purpose)
- "Can we schedule a meeting to discuss your career?" → **OPPORTUNITY** (career-focused)
- General networking without specific opportunity → **OTHER** or **OPPORTUNITY** based on context

## Notes

- **Priority**: OPPORTUNITY is high-priority intent - students don't want to miss legitimate chances
- **Timeliness**: These often require quick response - system should act promptly
- **Verification**: Always maintain scam detection vigilance - legitimate opportunities never ask for money upfront
- **Student Control**: Student should have final say on pursuing opportunities
- **Privacy**: Only collect information necessary for the specific opportunity
- **Legitimate vs Scam**: The key differentiator is whether money/sensitive financial info is requested

## Examples of Information Collection

### Good Collection (OPPORTUNITY):
- "When are you available this week for an interview?"
- "What's your email so we can send internship details?"
- "Do you have a CV we can review?"
- "What's the best phone number to reach you?"

### Red Flags (Likely SCAM):
- "What's your bank account number for salary deposit?"
- "Send your password to verify identity"
- "Pay the registration fee to confirm interview"
- "Provide credit card details for background check"
