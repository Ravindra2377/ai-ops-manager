# 🔧 Quick Setup Instructions

Great! MongoDB is installed. Now follow these steps:

## Step 1: ✅ Environment File Created

I've created `.env` file with:
- ✅ MongoDB connection: `mongodb://localhost:27017/ai-ops-manager`
- ✅ JWT Secret: Generated
- ✅ Encryption Key: Generated

## Step 2: Get API Credentials

You need 2 API keys to make the AI work:

### A) Gmail API (Google Cloud Console)

**Quick Steps:**
1. Open: https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name it: "AI Ops Manager" → Create
4. In search bar, type "Gmail API" → Enable it
5. In search bar, type "Google Calendar API" → Enable it
6. Go to "Credentials" (left sidebar)
7. Click "Create Credentials" → "OAuth 2.0 Client ID"
8. If asked, configure consent screen:
   - User Type: External → Create
   - App name: "AI Ops Manager"
   - User support email: Your email
   - Developer email: Your email
   - Save and Continue (skip scopes)
9. Back to Credentials → Create OAuth Client ID
10. Application type: "Web application"
11. Name: "AI Ops Manager"
12. Authorized redirect URIs → Add URI:
    ```
    http://localhost:5000/api/auth/gmail/callback
    ```
13. Click "Create"
14. **COPY** the Client ID and Client Secret

### B) Gemini API (Google AI Studio)

**Quick Steps:**
1. Open: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Select project (or create new)
4. **COPY** the API key

## Step 3: Update .env File

Open this file in a text editor:
```
d:\OneDrive\Desktop\Manager\ai-ops-manager\server\.env
```

Replace these lines:
```env
GMAIL_CLIENT_ID=<paste-your-client-id-here>
GMAIL_CLIENT_SECRET=<paste-your-client-secret-here>
GEMINI_API_KEY=<paste-your-gemini-key-here>
```

## Step 4: Start the Server

Open terminal in the server folder and run:
```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

---

## 🆘 Need Help?

**MongoDB not connecting?**
- Make sure MongoDB service is running
- Check Windows Services → MongoDB Server should be "Running"

**Can't get API keys?**
- I can guide you step-by-step through Google Cloud Console
- Just let me know which step you're stuck on

---

**Once the server is running, we'll test it and move to Phase 3!** 🚀
