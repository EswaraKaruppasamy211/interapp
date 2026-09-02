# SkillBridge Role-Aware AI Chatbot Implementation Guide

## Overview

This guide explains how to integrate the new role-aware AI chatbot system into the existing SkillBridge application. The system provides intelligent, context-aware assistance for students, companies, colleges, and admins.

## Architecture

```
USER QUESTION
    ↓
ROLE DETECTION (from authenticated user)
    ↓
PERMISSION VALIDATION
    ↓
INTENT PARSING
    ↓
DATABASE QUERIES (filtered & safe)
    ↓
AI CONTEXT BUILDING
    ↓
AI RESPONSE GENERATION
    ↓
SECURITY FILTERING
    ↓
CLIENT RESPONSE
```

## Files Created

### Backend Files

1. **`backend/ai-role-context.js`** - Role-specific system prompts and permissions
   - System prompts for each role
   - Permission matrices
   - Quick action definitions
   - Intent parsing

2. **`backend/ai-db-queries.js`** - Safe database query layer
   - Student profile queries
   - Candidate search (company use)
   - College student analytics
   - Platform statistics
   - Sensitive data filtering

3. **`backend/ai-chat-handler.js`** - Main AI processing logic
   - Intent recognition
   - Data retrieval orchestration
   - Context building
   - Response generation

4. **`backend/ai-chat-api.js`** - API integration module
   - Express/HTTP request handler
   - Authentication validation
   - Response formatting
   - Rate limiting hooks

### Frontend Files

1. **`frontend/ai-chatbot.js`** - Role-aware chatbot UI component
   - Widget creation and styling
   - Message management
   - Quick action buttons
   - Role-specific welcome messages

## Integration Steps

### Step 1: Import Modules in server.js

Add these imports at the top of your `backend/server.js`:

```javascript
const aiChatAPI = require('./ai-chat-api');
const { handleAIChat } = require('./ai-chat-handler');
```

### Step 2: Update the /api/ai/chat Endpoint

Find the existing `/api/ai/chat` endpoint in `server.js` (around line 823) and replace it with:

```javascript
if (pathname === '/api/ai/chat' && req.method === 'POST') {
  return aiChatAPI.handleChatRequest(db, req, res, authUser, parseJSON, sendJSON);
}
```

### Step 3: Add the Frontend Script

In your main HTML file (e.g., `index.html`), add the chatbot script right before closing `</body>`:

```html
<!-- Role-Aware AI Chatbot -->
<script src="/frontend/ai-chatbot.js"></script>
```

Make sure the script loads AFTER the main app.js so that `window.currentUser` and `window.currentRole` are available.

### Step 4: Database Schema Updates

If your database schema doesn't have these tables, create them. The AI system expects:

```sql
-- Student skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT,
  years_of_experience REAL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  organization TEXT,
  issue_date TEXT,
  credential_id TEXT,
  credential_url TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  skills_used TEXT,
  github_url TEXT,
  project_url TEXT,
  completion_date TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Step 5: Customize AI Responses

Edit `backend/ai-chat-handler.js` to customize response generation. Currently, there are placeholder functions:

- `generateStudentProfileAnalysis()`
- `generateCandidateSearchResponse()`
- `generateStudentAnalysisResponse()`
- `generateAdminInsightsResponse()`

These can be enhanced or connected to your LLM API (OpenAI, Anthropic, etc.).

## API Endpoints

### POST /api/ai/chat

Sends a message to the AI chatbot.

**Request:**
```json
{
  "message": "What skills should I improve?",
  "portal": "student",
  "currentPage": "dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Based on your profile...",
  "role": "student",
  "intent": "profile_improvement"
}
```

**Special Messages:**
- `"__INIT__"` - Get welcome message and quick actions
- `"__QUICK_ACTIONS__"` - Get role-specific quick action buttons

## Role-Specific Behaviors

### Student Portal
- Can access own profile, skills, certificates, projects
- Cannot access other students' private data
- Receives career guidance and improvement suggestions
- Quick actions: Profile Analysis, My Skills, Certificates, Career Suggestions

### Company Portal
- Can search for student candidates
- Can view public student profiles
- Cannot access sensitive personal data
- Receives candidate rankings and matching scores
- Quick actions: Find Candidates, Skill Search, Compare, Job Matching

### College Portal
- Can access students from their institution
- Can view skill distributions and statistics
- Receives placement readiness insights
- Quick actions: Student List, Top Students, Placement Ready, Skill Analysis

### Admin Portal
- Can access platform-wide statistics
- Can view aggregated data
- Cannot access individual passwords or tokens
- Receives platform health insights

## Security Considerations

1. **Authentication**: All requests require valid authentication
2. **Authorization**: Each query is validated against role permissions
3. **Data Filtering**: Sensitive fields are removed before sending to frontend
4. **Privacy**: Student-to-student queries are blocked
5. **Rate Limiting**: Hooks provided for implementing rate limits

## Environment Variables

Add to your `.env` file:

```env
AI_MODEL=gpt-3.5-turbo  # if using OpenAI
OPENAI_API_KEY=your_key_here
AI_RATE_LIMIT=100  # requests per hour
AI_CONTEXT_LIMIT=8000  # max tokens for context
```

## LLM Integration (Optional)

To connect to an actual LLM, modify `backend/ai-chat-handler.js`:

```javascript
async function generateAIResponse(userMessage, context, role) {
  const { systemPrompt, dataContext } = context;
  
  // Example with OpenAI
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context:\n${dataContext}\n\nQuestion: ${userMessage}` }
    ],
    max_tokens: 500,
    temperature: 0.7
  });
  
  return response.choices[0].message.content;
}
```

## Testing

### Test Student Chat
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -d '{"message": "Analyze my profile"}'
```

### Test Company Chat
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COMPANY_TOKEN" \
  -d '{"message": "Find students with Python skills"}'
```

## Features

✅ Role-aware system prompts  
✅ Database-integrated queries  
✅ Permission validation  
✅ Intent parsing from natural language  
✅ Quick action suggestions  
✅ Role-specific welcome messages  
✅ Responsive UI component  
✅ Mobile-friendly chatbot  
✅ Chat history tracking  
✅ Typing indicators  
✅ Sensitive data filtering  
✅ Error handling  

## Troubleshooting

### Chatbot not appearing
- Check that `ai-chatbot.js` is loaded after `app.js`
- Verify `window.currentUser` and `window.currentRole` are set
- Check browser console for errors

### Messages not being sent
- Verify authentication token is valid
- Check that `/api/ai/chat` endpoint is properly registered
- Review backend logs for API errors

### No quick actions showing
- Ensure database has user profile data
- Verify role is correctly detected
- Check that permissions are properly defined

### Slow responses
- Check database query performance
- Consider adding database indexes
- Verify LLM API latency if connected

## Next Steps

1. Test all role portals with sample queries
2. Customize response generation for your use case
3. Connect to your preferred LLM API
4. Implement rate limiting
5. Add chat history persistence
6. Create analytics dashboard for AI usage
7. Gather user feedback and iterate

## Support

For issues or feature requests, refer to the main SkillBridge documentation or check the implementation files for detailed comments.
