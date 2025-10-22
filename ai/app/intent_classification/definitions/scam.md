# SCAM Intent Definition

## Overview
Detection of scam calls or malicious callers attempting fraud targeting international students.

## Description
Scam calls that impersonate authorities, use high-pressure tactics, or request sensitive information and payments. Common targets are international students who may be unfamiliar with local systems.

## Characteristics

- Requests for money transfers or immediate payments (non-service related)
- Impersonating government agencies (tax office, police, immigration, Medicare, Centrelink)
- Impersonating banks or financial institutions
- Using threatening or intimidating language
- Requesting sensitive information (bank account, password, credit card, TFN)
- Claims of urgent situations requiring immediate action
- Mentions of legal action, arrest, fines, or penalties
- Claims that accounts are frozen or compromised
- Requests to purchase gift cards or prepaid cards (iTunes, Steam, etc.)
- High-pressure sales tactics or threats
- Claims of winning lottery/prizes but requiring upfront fees
- Tech support scams claiming virus/security issues
- Deportation or visa threats

## Positive Examples

These messages **SHOULD** be classified as SCAM:

1. "This is the Australian Tax Office. You have unpaid taxes of $5000 and must transfer immediately or face prosecution."
2. "Your bank account has been frozen. Please provide your account number and password to unlock it."
3. "This is the police. You are suspected of money laundering and must transfer bail money immediately."
4. "Congratulations! You've won a million dollars, but you need to pay $5000 processing fee first."
5. "Your package has been seized by customs. Pay the $3000 fine immediately or it will be destroyed."
6. "This is Medicare calling. Your account has suspicious activity. Please provide your bank details immediately."
7. "Your internet will be disconnected in 24 hours. Press 1 to make immediate payment."
8. "Your Centrelink benefits have been frozen. Provide your bank account and Tax File Number immediately."
9. "You need to purchase iTunes gift cards worth $2000 to pay your tax debt immediately."
10. "Your computer has viruses. We are Microsoft technical support and need remote access to fix it."
11. "Urgent: Your visa is expiring. Pay the renewal fee immediately or you will be deported."
12. "Hi, this is your grandson. I'm in an emergency and need money urgently. Please transfer immediately."

## Negative Examples

These messages should **NOT** be classified as SCAM:

1. "What are your office hours?" → FAQ
2. "I'd like to leave a message" → OTHER
3. "I have a question about my enrollment" → FAQ or OTHER
4. "Can someone call me back?" → OTHER
5. "I need help with my application" → OTHER
6. "When is the application deadline?" → FAQ
7. "Do I need to pay the enrollment fee upfront?" → FAQ (legitimate payment question)

## Keywords

tax office, ATO, Australian Taxation Office, police, arrest, warrant, fine, penalty, transfer money, bank account, password, PIN, credit card, CVV, urgent, immediate payment, immediate action, account frozen, account locked, account suspended, lottery, won prize, prize winner, customs, parcel seized, Medicare, Centrelink, benefits frozen, gift card, iTunes card, Steam card, Google Play card, threat, threatening, lawsuit, court notice, legal action, fraud investigation, money laundering, suspicious activity, verify identity, remote access, virus, malware, Microsoft support, tech support, visa expiring, deportation, immigration officer, grandson scam, family emergency

## Classification Rules

### High Confidence (>0.85)
- Multiple scam characteristics match (3+)
- Contains explicit payment requests with threats
- Requests gift card payments
- Impersonates government agencies with threats

### Medium Confidence (0.70-0.85)
- Some scam characteristics match (1-2)
- Urgent language without explicit threats
- Suspicious but not obvious fraud

### Low Confidence (<0.70)
- Ambiguous cases → Classify as OTHER for safety
- Legitimate inquiries about payments → FAQ

## Action on Detection

When SCAM intent is detected with high confidence:

1. **Terminate call immediately**
2. **Log incident for security review**
3. **Do not engage with caller**
4. **Do not provide any information**
5. **Record call details for pattern analysis**

## Notes

- International students are prime targets for scams
- Scammers often exploit unfamiliarity with Australian systems
- When in doubt about legitimacy → classify as OTHER for human review
- Better to have false positives (human review) than false negatives (student scammed)
