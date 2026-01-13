# AI Personal Ops Manager - Backend

Production-grade backend for AI Personal Ops Manager MVP.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB running locally or MongoDB Atlas account
- Google Cloud Console project (for Gmail API)
- Google AI Studio account (for Gemini API)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Then edit `.env` and add your actual credentials:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Random secret key (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `ENCRYPTION_KEY`: 32-character encryption key
- `GMAIL_CLIENT_ID` & `GMAIL_CLIENT_SECRET`: From Google Cloud Console
- `GEMINI_API_KEY`: From Google AI Studio

3. **Start development server:**
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## 📁 Project Structure

```
server/
├── models/              # MongoDB schemas
│   ├── User.js         # User model with auth
│   ├── Email.js        # Email storage with AI analysis
│   ├── Task.js         # Task management
│   └── CalendarSuggestion.js
├── routes/             # API routes
│   └── auth.js         # Authentication & Gmail OAuth
├── services/           # Business logic
│   └── aiService.js    # Gemini AI integration
├── middleware/         # Express middleware
│   └── auth.js         # JWT verification
├── utils/              # Utilities
│   └── encryption.js   # Token encryption
├── prompts/            # AI prompt templates
│   └── emailAnalysis.js
├── config/             # Configuration
│   └── database.js     # MongoDB connection
└── index.js            # Server entry point
```

## 🔑 Getting API Keys

### Gmail API (Google Cloud Console)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable Gmail API and Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:5000/api/auth/gmail/callback`
6. Copy Client ID and Client Secret

### Gemini API (Google AI Studio)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy and add to `.env`

## 🧪 Testing

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/gmail/authorize` - Get Gmail OAuth URL
- `GET /api/auth/gmail/callback` - OAuth callback

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ AES-256 token encryption
- ✅ Environment variable protection
- ✅ CORS enabled

## 🛠️ Next Steps (Days 4-6)

- [ ] Implement Gmail service layer
- [ ] Create email sync job
- [ ] Build email routes
- [ ] Test AI analysis pipeline

## 📚 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **AI**: Google Gemini API
- **Auth**: JWT + bcryptjs
- **Jobs**: BullMQ (coming soon)
