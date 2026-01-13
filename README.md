# AI Personal Ops Manager

**"You live your life. AI runs the operations."**

An AI-powered decision intelligence app for busy founders and executives. Analyzes emails, detects intent, and suggests smart actions—but never acts without your approval.

## 🎯 What It Does

- **Email Intelligence**: Automatically analyzes Gmail for intent, urgency, and required actions
- **Smart Suggestions**: AI recommends replies, tasks, and calendar events
- **Daily Briefs**: Morning priorities and evening summaries
- **Human-in-the-Loop**: You approve every action—AI suggests, you decide

## 🏗️ Project Structure

```
ai-ops-manager/
├── server/          # Node.js + Express backend
└── client/          # React frontend (coming soon)
```

## 🚀 Current Status

✅ **Phase 1 Complete**: Planning & Architecture
✅ **Phase 2 Complete**: Backend Foundation (Days 1-3)
- MongoDB models (User, Email, Task, CalendarSuggestion)
- JWT authentication system
- Gmail OAuth 2.0 integration
- Gemini AI service layer
- Production-grade AI prompts

🔄 **Next**: Phase 3 - Gmail Integration (Days 4-6)

## 🛠️ Tech Stack

**Backend**:
- Node.js + Express
- MongoDB + Mongoose
- Gemini AI API
- Gmail API + Google Calendar API
- JWT + bcryptjs
- BullMQ (job queues)

**Frontend** (coming soon):
- React
- Tailwind CSS
- Axios

## 📖 Documentation

See `server/README.md` for backend setup instructions.

## 🎯 MVP Timeline

- Days 1-3: ✅ Backend foundation
- Days 4-6: Gmail integration
- Days 7-9: AI intelligence layer
- Days 10-12: Task & calendar management
- Days 13-14: Frontend UI

## 💰 Target Audience

Founders and executives who need AI to help manage email chaos and make better decisions about their time.

## 🔒 Security First

- AI suggests only, never auto-sends
- Encrypted OAuth tokens
- JWT authentication
- No data shared with third parties

---

Built with ❤️ for busy founders who want their time back.
