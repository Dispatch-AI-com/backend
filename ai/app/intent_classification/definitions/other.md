# OTHER Intent Definition

## Overview
Catch-all category for complex issues, message leaving requests, callbacks, unclear intents, or anything requiring human handling and personalized attention.

## Description
This intent covers everything that doesn't fit SCAM or OPPORTUNITY. It includes requests to leave messages, callback requests, complex or unique situations, complaints, special circumstances, and any ambiguous cases. This is the **conservative default** when intent is unclear.

## Characteristics

- Requests to leave a message or voicemail
- Callback requests ("call me back later")
- Complex or unique situations requiring individual attention
- Requests that don't fit standard questions or opportunities
- Unclear or ambiguous intent
- Personal circumstances requiring case-by-case handling
- Complaints, disputes, or dissatisfaction
- Special requests or exceptions to standard procedures
- Currently unavailable and needs human follow-up
- Requests for one-on-one consultation or meeting
- Multiple complex questions needing detailed discussion
- Special cases or unique circumstances
- Situations requiring personalized assessment

## Positive Examples

These messages **SHOULD** be classified as OTHER:

1. "I can't talk right now. Can I leave a message?"
2. "Can someone call me back later?"
3. "I have a special situation regarding my visa that needs discussion"
4. "I can't talk now, but I need to leave some information"
5. "I need to speak with someone about a complex enrollment issue"
6. "This is regarding a personal matter that requires individual attention"
7. "I'm not satisfied with how my case was handled"
8. "Can I schedule a one-on-one consultation?"
9. "I have multiple questions that need detailed discussion"
10. "My situation is complicated and I need personalized help"
11. "I'm busy right now. Please have someone contact me when they're available."
12. "I'd like to leave a message for the admissions office."
13. "I need help with a unique immigration case"
14. "Can someone review my special circumstances?"
15. "I'm driving right now, can you have someone call me back?"

## Negative Examples

These messages should **NOT** be classified as OTHER:

1. "We'd like to invite you for a job interview" → OPPORTUNITY
2. "Transfer money immediately" → SCAM
3. "Our company has an internship position available" → OPPORTUNITY
4. "I'm looking for research assistants" → OPPORTUNITY
5. "You have unpaid taxes, pay immediately" → SCAM
6. "You must pay immediately or face arrest" → SCAM

## Keywords

leave message, message, voicemail, callback, call back, call me back, contact me later, special case, special situation, unique situation, complex, complicated, individual attention, personal, personal matter, discuss, discussion, detailed discussion, consultation, one-on-one, meeting, schedule appointment, exception, special circumstances, complaint, not satisfied, unhappy, dispute, issue with, problem with, not standard, unique, unusual, busy, not available, can't talk, driving, later, follow up, follow-up, speak with someone, talk to someone, human, representative, detailed, complicated situation, case-by-case, personalized, personalized help, individual help

## Classification Rules

### High Confidence (>0.80)
- Explicit message leaving or callback request
- Clear statement of complexity or special circumstances
- Complaints or dissatisfaction
- Unavailability requiring follow-up

### Medium Confidence (0.65-0.80)
- Somewhat complex situation
- Might need personalization
- Ambiguous between FAQ and OTHER

### Low Confidence (<0.65)
- Very unclear intent
- Could be anything
- **Default to OTHER for safety**

## Conservative Classification Approach

**IMPORTANT**: When classification is uncertain, always default to OTHER.

- ✅ Better to have human review than incorrect automation
- ✅ False positive (human reviews FAQ) = minor inefficiency
- ❌ False negative (FAQ system handles complex case) = poor service

### Decision Tree

```
Is it clearly a fraud attempt?
├─ Yes → SCAM
└─ No → Continue

Is it a legitimate opportunity (interview, job, research)?
├─ Yes → OPPORTUNITY
└─ No → Continue

Is it complex, personalized, or unclear?
├─ Yes → OTHER
└─ Unsure → OTHER (default)
```

## Action on Detection

When OTHER intent is detected:

1. **Preserve full call summary**
2. **Queue for human manual processing**
3. **Do not attempt automated response**
4. **Capture all context and details**
5. **Flag urgency if mentioned**
6. **Assign to appropriate department if specified**

For message leaving:
- Record message content
- Capture contact information
- Note preferred callback time
- Route to appropriate person/department

For callbacks:
- Record contact number
- Note availability/preferred time
- Capture reason for call
- Queue for staff follow-up

## Important Distinctions

### OTHER vs OPPORTUNITY

**OTHER** is for:
- ❌ Complex situations
- ❌ Personalized needs
- ❌ Actions required (leave message, callback)
- ❌ Special circumstances
- ❌ Unclear intents

**OPPORTUNITY** is for:
- ✅ Job interviews or employment offers
- ✅ Research or academic positions
- ✅ Internships or fellowships
- ✅ Networking events
- ✅ Legitimate chances for students

### OTHER vs SCAM

**OTHER** includes:
- ✅ Legitimate but complex inquiries
- ✅ Students needing help
- ✅ Unclear but non-threatening

**SCAM** includes:
- ❌ Fraud attempts
- ❌ Threats and intimidation
- ❌ Requests for sensitive info/money
- ❌ Impersonation of authorities

## Examples of Ambiguous Cases

| Message | Intent | Reasoning |
|---------|--------|-----------|
| "I need this information urgently" | OTHER | Unclear what they need, requires clarification |
| "We have a position but need to discuss terms" | OPPORTUNITY | Employment opportunity with discussion needed |
| "Can I get an extension on the deadline?" | OTHER | Requires individual assessment |
| "I'm having trouble understanding this" | OTHER | Unclear, needs clarification |
| "Can you help me?" | OTHER | Too vague, needs clarification |
| "I need to discuss something" | OTHER | Unclear, requires human |

## Notes

- **Default to OTHER when uncertain** - this is the safest approach
- OTHER ensures human review for complex or unclear cases
- Students with genuine needs will get proper attention
- Prevents automated system from handling inappropriate cases
- Maintains service quality by routing complex cases to humans
- Message leaving is a common use case for international students
- Callback requests respect student schedules and time zones
