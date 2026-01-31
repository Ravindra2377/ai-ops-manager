/**
 * Production-grade AI prompts for email analysis
 * These prompts are designed for Gemini API
 */

const INTENT_DETECTION_PROMPT = (from, subject, body) => `
You are an executive assistant analyzing emails for a busy founder/executive.

Email Details:
From: ${from}
Subject: ${subject}
Body: ${body}

Classify the intent into ONE of these categories:
- MEETING_REQUEST: Someone wants to schedule time, mentions meeting/call/discussion
- TASK_REQUEST: Action item or deliverable requested from the recipient
- QUESTION: Needs information, decision, or clarification
- FYI: Informational only, no action needed (newsletters, updates, confirmations)
- URGENT: Time-sensitive, contains urgent language or immediate deadline
- MARKETING: Promotional, sales, discounts, offers
- NEWSLETTER: Digest, summary, weekly update, automated content

Analyze the email and return ONLY valid JSON (no markdown, no explanation):
{
  "intent": "MEETING_REQUEST",
  "confidence": 0.95,
  "reasoning": "Contains phrases like 'let's meet' and suggests specific times"
}
`;

const URGENCY_ASSESSMENT_PROMPT = (emailContent, intent) => `
Assess the priority of this email based on RISK, URGENCY, and DECISION IMPACT.

Email Content: ${emailContent}
Detected Intent: ${intent}

HARD RULE: If Intent is 'MARKETING' or 'NEWSLETTER', Priority MUST be LOW.
HARD RULE: Marketing/Newsletters/Automated-FYI are ALWAYS LOW.

Evaluation Criteria (Score 0-10):
- Has concrete deadline? (+4)
- Urgency language (ASAP, today, EOD)? (+3)
- Action/Approval/Difference-making request? (+3)
- "Blocking" language? (+3)
- Important Sender (Boss/Client)? (+2)
- FYI/CC-only? (-2)
- Marketing? (-5)

Priority Mapping:
- Score >= 7: HIGH (Risk/Blockage if ignored)
- Score 3-6: MEDIUM (Needs action, timing flexible)
- Score <= 2: LOW (No action needed / Safe to ignore)

Return ONLY valid JSON:
{
  "urgency": "HIGH", // or "MEDIUM" or "LOW"
  "reasoning": "Marked HIGH because it requests approval (Action) and has a deadline today (Urgency)."
}
`;

const ACTION_SUGGESTION_PROMPT = (emailContent, intent, urgency) => `
You are suggesting specific, actionable next steps for a founder/executive.

Email: ${emailContent}
Intent: ${intent}
Urgency: ${urgency}

Suggest 1-3 concrete actions. Be specific and helpful.

Return ONLY valid JSON (no markdown, no explanation):
{
  "actions": [
    {
      "type": "REPLY",
      "description": "Send confirmation of meeting time for Tuesday 3pm",
      "priority": 1
    },
    {
      "type": "CREATE_TASK",
      "description": "Add 'Review Q1 report' to tasks with Friday deadline",
      "priority": 2
    }
  ]
}

Action types available:
- REPLY: Draft a response
- CREATE_TASK: Convert to actionable task
- SCHEDULE_MEETING: Add to calendar
- FOLLOW_UP: Set reminder to follow up later
- IGNORE: No action needed
`;

const REPLY_DRAFT_PROMPT = (emailContent, intent, senderName) => `
Draft a professional, concise reply for a busy executive.

Guidelines:
- Tone: Professional but warm and human
- Length: 2-4 sentences maximum
- Be direct and clear
- Match the formality of the original email

Email to reply to:
${emailContent}

Intent: ${intent}
Sender: ${senderName}

Return ONLY the draft reply text (no JSON, no quotes, no markdown).
`;

const DAILY_BRIEF_PROMPT = (emails, tasks, timeOfDay) => `
Create a ${timeOfDay} brief for a busy founder/executive.

${timeOfDay === 'morning' ? 'Focus on: Today\'s priorities, urgent items, key meetings' : 'Focus on: Unfinished tasks, what needs rescheduling, tomorrow\'s prep'}

Recent Emails (last 24h):
${emails.map(e => `- From: ${e.from}, Subject: ${e.subject}, Urgency: ${e.urgency}`).join('\n')}

Current Tasks:
${tasks.map(t => `- ${t.title} (${t.priority}, Due: ${t.dueDate || 'No deadline'})`).join('\n')}

Return ONLY valid JSON (no markdown, no explanation):
{
  "summary": "Brief overview of the day/evening",
  "priorities": [
    {
      "item": "Respond to client meeting request",
      "reason": "High urgency, needs confirmation by EOD",
      "action": "Reply to confirm Tuesday 3pm"
    }
  ],
  "suggestions": [
    "Reschedule low-priority task 'Review blog post' to next week"
  ]
}

Keep it concise and actionable. Max 3-5 priorities.
`;

module.exports = {
  INTENT_DETECTION_PROMPT,
  URGENCY_ASSESSMENT_PROMPT,
  ACTION_SUGGESTION_PROMPT,
  REPLY_DRAFT_PROMPT,
  DAILY_BRIEF_PROMPT,
};
