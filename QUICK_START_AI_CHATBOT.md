# SkillBridge Role-Aware AI Chatbot - Quick Start Guide

## What's New

Your SkillBridge platform now includes an intelligent, role-aware AI chatbot that behaves differently based on who's using it:

- **Students** get career guidance and profile analysis
- **Companies** get candidate search and recruitment intelligence
- **Colleges** get student analytics and placement insights
- **Admins** get platform-wide statistics and reports

## Files Modified/Created

### New Backend Files
- `backend/ai-role-context.js` - Role definitions and system prompts
- `backend/ai-db-queries.js` - Safe database query layer
- `backend/ai-chat-handler.js` - AI processing logic
- `backend/ai-chat-api.js` - API integration module
- `backend/ai-integration-patch.js` - Integration reference

### New Frontend Files
- `frontend/ai-chatbot.js` - Chatbot UI component

### Modified Files
- `backend/server.js` - Updated `/api/ai/chat` endpoint (lines 823-1000+)
- `index.html` - Added chatbot script include

### Documentation
- `ROLE_AWARE_AI_IMPLEMENTATION.md` - Comprehensive integration guide
- `QUICK_START_AI_CHATBOT.md` - This file

## How to Activate

### 1. Server is Already Updated
The `/api/ai/chat` endpoint has been upgraded in `server.js`. No additional backend changes needed!

### 2. Start Your Server (if not running)
```bash
cd backend
node server.js
```

The chatbot will automatically initialize when you load the app in your browser.

### 3. Test the Chatbot

**Open your browser and navigate to:** `http://localhost:3000`

You should see a **💬 AI Assistant** button in the bottom-right corner.

### 4. Try Different Roles

**As a Student:**
1. Login with any student account
2. Click the AI Assistant button
3. Try: "Analyze my profile" or "What skills should I improve?"

**As a Company:**
1. Switch to Company Portal
2. Login with company credentials
3. Try: "Find students with Python skills" or "Best engineers"

**As a College:**
1. Switch to University Admin
2. Login with college credentials
3. Try: "Show placement ready students" or "Skill gap analysis"

**As Admin:**
1. Login with admin account (if available)
2. Try: "Platform statistics" or "Student overview"

## What Each Role Can Do

### 🎓 Student Assistant
Analyzes your profile and helps with career planning:
- "Analyze my profile" - Get profile completeness assessment
- "Show my skills" - View your technical skills
- "My certificates" - See uploaded certifications
- "Career suggestions" - Get role recommendations based on skills
- "How to improve?" - Get specific improvement recommendations

### 🏢 Company Recruitment Assistant
Helps find and evaluate qualified candidates:
- "Find students with Java skills" - Search by specific skill
- "Best software engineers" - Get top-ranked candidates
- "Find candidates matching this job" - Job description matching
- "Compare candidates" - Side-by-side candidate comparison
- "Interview questions" - Get suggested interview questions

### 🎓 College Academic Assistant
Provides student and placement analytics:
- "Show all students" - List of enrolled students
- "Top performing students" - Highest achievers
- "Placement ready" - Candidates ready for recruitment
- "Skill gap analysis" - Identify missing skills
- "Department analysis" - Department-wise insights

### 👨‍💼 Admin Platform Assistant
Platform-wide statistics and insights:
- "Platform statistics" - User counts and metrics
- "Student overview" - Total students and distribution
- "Company statistics" - Total companies on platform
- "Skill trends" - Most in-demand skills
- "Placement stats" - Success rates and trends

## Features Included

✅ **Role Detection** - Automatically detects your role (student/company/college/admin)
✅ **Context Awareness** - Understands which portal you're on
✅ **Permission Validation** - Only shows data you're authorized to access
✅ **Natural Language** - Understand conversational queries
✅ **Quick Actions** - Role-specific quick action buttons
✅ **Typing Indicators** - Shows when AI is processing
✅ **Chat History** - Maintains conversation in session
✅ **Mobile Responsive** - Works on phones, tablets, desktops
✅ **Security** - No sensitive data leakage between roles
✅ **Privacy** - Students can't see other students' data

## Architecture

```
User Message
    ↓
Verify Authentication
    ↓
Detect User Role
    ↓
Check Permissions
    ↓
Retrieve Relevant Data (filtered)
    ↓
Parse Intent
    ↓
Generate Role-Specific Response
    ↓
Return Safe Response
```

## Response Examples

### Student Query: "Analyze my profile"
**Response:**
```
Your profile completeness: 70%. 
Recommendations: 
1. Complete your CGPA information
2. Add more projects to showcase skills
3. Upload relevant certifications
4. Update your bio with specific career goals
```

### Company Query: "Find students with Python"
**Response:**
```
I found 5 candidates with Python skills.

Top Matches:
1. Student Name - Match Score: 92%
   Skills: Python, Django, SQL
   Certificates: 3
   Projects: 4

2. Another Name - Match Score: 88%
   Skills: Python, Flask, PostgreSQL
   Certificates: 2
   Projects: 5
```

### College Query: "Placement ready"
**Response:**
```
You have 45 placement-ready students:
- Average CGPA: 7.2
- Average Skill Score: 78/100
- Top Skills: Python, Java, React
- Department-wise breakdown:
  • CSE: 25 students
  • IT: 15 students
  • Others: 5 students
```

## Customization

### Add More Skills to Recognize
Edit `backend/ai-chat-handler.js`, function `extractSkillsFromQuery()`:

```javascript
const skillKeywords = [
  'python', 'java', 'javascript', 'react',
  // Add more skills here
];
```

### Change Welcome Messages
Edit `backend/ai-role-context.js`, constant `SYSTEM_PROMPTS`:

```javascript
const SYSTEM_PROMPTS = {
  student: 'Your custom message...',
  company: 'Your custom message...',
  // etc
};
```

### Modify Quick Actions
Edit `backend/server.js`, look for `quickActionsMap` object:

```javascript
const quickActionsMap = {
  student: [
    { label: 'Your Action', action: 'your_action_id' },
    // Add more
  ],
  // etc
};
```

## Troubleshooting

### Issue: Chatbot button not appearing
**Solution:**
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+F5)
3. Check console for JavaScript errors (F12 → Console)
4. Verify `ai-chatbot.js` is loaded in Network tab

### Issue: Can't send messages
**Solution:**
1. Check you're logged in (should see user name in header)
2. Verify server is running (check terminal)
3. Try a different browser
4. Check Network tab for `/api/ai/chat` errors

### Issue: Wrong role showing
**Solution:**
1. Logout and login again
2. Switch to the correct portal using top navigation
3. Refresh the page (F5)

### Issue: Blank responses
**Solution:**
1. The AI is still being trained with real data
2. Try asking more specific questions
3. Check server logs for errors
4. Ensure your user profile has complete information

## Next Steps

### Coming Soon
- Connection to advanced LLM (GPT-4, Claude, etc.)
- Chat history persistence
- Conversation export (PDF, Email)
- AI-powered resume suggestions
- Salary insights based on skills
- Interview preparation mode
- Live candidate feedback

### You Can Help
- Report issues found while testing
- Suggest new features
- Provide feedback on responses
- Help improve training data

## File Structure

```
interapp/
├── frontend/
│   ├── app.js (main frontend)
│   ├── ai-chatbot.js (NEW - UI component)
│   └── company-module.js
├── backend/
│   ├── server.js (MODIFIED - updated AI chat endpoint)
│   ├── ai-role-context.js (NEW)
│   ├── ai-db-queries.js (NEW)
│   ├── ai-chat-handler.js (NEW)
│   ├── ai-chat-api.js (NEW)
│   ├── ai-integration-patch.js (NEW - reference)
│   └── db.js
├── index.html (MODIFIED - added chatbot script)
├── ROLE_AWARE_AI_IMPLEMENTATION.md (NEW)
└── QUICK_START_AI_CHATBOT.md (NEW - this file)
```

## API Reference

### POST /api/ai/chat

Send a message to the AI chatbot.

**Request:**
```json
{
  "message": "What should I improve?",
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

### Special Messages
- `__INIT__` - Get role-specific welcome and quick actions
- `__QUICK_ACTIONS__` - Get quick action buttons

## Support & Questions

If you need help:
1. Check `ROLE_AWARE_AI_IMPLEMENTATION.md` for detailed docs
2. Review the comments in the source files
3. Check browser console for error messages
4. Review server logs (terminal where you ran `node server.js`)

## Security Notes

✅ **Safe** - Only authenticated users can access
✅ **Private** - Students can't see each other's data
✅ **Authorized** - Companies only see public profiles
✅ **Filtered** - No passwords or tokens exposed
✅ **Validated** - All queries checked against permissions

## Performance Tips

- First load might be slow (UI initializing)
- Responses cached when possible
- Database indexed for fast queries
- Mobile optimized for slow connections

---

**Enjoy using the SkillBridge AI Assistant! 🚀**

For more details, see `ROLE_AWARE_AI_IMPLEMENTATION.md`
