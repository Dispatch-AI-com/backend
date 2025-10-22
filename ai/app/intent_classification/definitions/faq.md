# FAQ Intent Definition

## Overview
Common student questions that can be answered by the FAQ (Frequently Asked Questions) system with standard, factual responses.

## Description
Simple, straightforward questions about office operations, deadlines, fees, location, contact information, and services. These questions have standard answers that don't require personalized consultation or complex discussion.

## Characteristics

- Asking about office hours, opening/closing times, or availability
- Inquiring about enrollment deadlines or application dates
- Questions about tuition fees or payment schedules
- Asking about campus location, address, or directions
- Questions about contact information (phone, email)
- Questions about general services offered
- Inquiring about operating hours or schedules (including weekends)
- Simple factual questions with standard answers
- Questions about visa requirements or required documentation
- Payment methods inquiries (what payment types accepted)
- Questions about whether international students are accepted
- Asking about application requirements or process overview

## Positive Examples

These messages **SHOULD** be classified as FAQ:

1. "What are your office hours?"
2. "When is the enrollment deadline for next semester?"
3. "What time do you open?"
4. "How much are the tuition fees for international students?"
5. "Where is your office located?"
6. "What's your phone number?"
7. "Do you have weekend hours?"
8. "What documents do I need for enrollment?"
9. "What services do you provide?"
10. "What are the application deadlines?"
11. "Do you accept international students?"
12. "What's your email address?"
13. "What time do you close?"
14. "What payment methods do you accept?"
15. "Where can I find your address?"

## Negative Examples

These messages should **NOT** be classified as FAQ:

1. "I want to leave a message" → OTHER
2. "Transfer money immediately or face arrest" → SCAM
3. "I have a complex immigration issue that needs discussion" → OTHER
4. "I'm not available right now, can someone call me back?" → OTHER
5. "This is regarding a special case that needs individual attention" → OTHER
6. "Can I schedule a one-on-one consultation?" → OTHER
7. "My situation is complicated and I need personalized help" → OTHER

## Keywords

office hours, opening hours, closing hours, business hours, deadline, due date, when, what time, when do you open, when do you close, tuition, tuition fees, fees, cost, how much, price, location, address, where, where are you, directions, phone number, telephone, contact number, email, email address, contact, how to contact, services, what services, what do you offer, what, enrollment, enrolment, application, apply, requirements, required documents, documents needed, visa requirements, visa documents, weekend, Saturday, Sunday, weekend hours, schedule, available, availability, international students, do you accept, payment methods, how to pay, cash, card, credit card

## Classification Rules

### High Confidence (>0.80)
- Clear, simple question about standard information
- Matches FAQ keywords strongly
- No complexity or personalization needed
- Has a definite factual answer

### Medium Confidence (0.65-0.80)
- Question seems simple but slightly ambiguous
- Could be FAQ or might need clarification
- Still likely a standard question

### Low Confidence (<0.65)
- Ambiguous or complex question → Classify as OTHER
- Requires personalized response → OTHER
- Cannot be answered with standard FAQ → OTHER

## Important Distinctions

### FAQ vs OTHER

**FAQ** questions are:
- ✅ Simple and straightforward
- ✅ Have standard factual answers
- ✅ Don't require personalization
- ✅ Can be answered by knowledge base

**OTHER** questions are:
- ❌ Complex or unique situations
- ❌ Require individual consultation
- ❌ Need personalized responses
- ❌ Involve special circumstances

### Examples of the Distinction

| Message | Intent | Reason |
|---------|--------|--------|
| "What are your office hours?" | FAQ | Standard factual answer |
| "Can someone meet with me at 3pm?" | OTHER | Requires scheduling/personalization |
| "How much are tuition fees?" | FAQ | Standard answer |
| "Can I get a fee waiver for my situation?" | OTHER | Requires individual assessment |
| "What documents do I need?" | FAQ | Standard list |
| "Can you review my specific documents?" | OTHER | Requires personalized review |

## Action on Detection

When FAQ intent is detected:

1. **Route to FAQ system**
2. **Retrieve standard answer from knowledge base**
3. **Provide answer immediately**
4. **Ask if they have other questions**
5. **Escalate to OTHER if answer not satisfactory**

## Notes

- FAQ should only be used for questions with clear, standard answers
- When in doubt between FAQ and OTHER → choose OTHER
- Complex variations of simple questions should be OTHER
- Questions starting with "Can I...", "Will you...", "Could you..." often indicate OTHER (require action/personalization)
- Questions starting with "What...", "When...", "Where...", "How much..." often indicate FAQ (request information)
