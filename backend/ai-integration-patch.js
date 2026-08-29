/**
 * SkillBridge AI Chatbot - server.js Integration
 * 
 * This file shows how to integrate the role-aware AI system into server.js
 * Replace the old /api/ai/chat endpoint with this implementation
 */

// Add these imports at the top of server.js (with other requires)
const aiChatAPI = require('./ai-chat-api');
const aiRoleContext = require('./ai-role-context');
const aiDBQueries = require('./ai-db-queries');
const { handleAIChat } = require('./ai-chat-handler');

/**
 * IMPORTANT: In the existing server.js, around line 823, you'll find:
 * 
 *   if (pathname === '/api/ai/chat' && req.method === 'POST') {
 *     const authUser = requireStudent();
 *     ...
 *   }
 * 
 * REPLACE that entire block with the code below:
 */

// ============================================================================
// NEW /api/ai/chat ENDPOINT - Role-Aware AI Assistant
// ============================================================================

if (pathname === '/api/ai/chat' && req.method === 'POST') {
  // Get authenticated user regardless of role
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return sendJSON(401, {
      success: false,
      error: 'Unauthorized',
      response: 'Please log in to use the AI Assistant.'
    });
  }

  const authUser = verifyToken(token);
  if (!authUser) {
    return sendJSON(401, {
      success: false,
      error: 'Unauthorized',
      response: 'Your session has expired. Please log in again.'
    });
  }

  // Get user profile based on role
  let userProfile = null;
  if (authUser.role === 'student') {
    userProfile = state.studentProfiles[authUser.id] || {};
  } else if (authUser.role === 'company') {
    userProfile = state.companyProfiles[authUser.id] || {};
  } else if (authUser.role === 'college') {
    userProfile = state.collegeProfiles[authUser.id] || {};
  }

  // Enhance authUser with profile data
  const enhancedUser = {
    ...authUser,
    name: userProfile?.name || userProfile?.company_name || userProfile?.college_name,
    collegeName: userProfile?.college_name,
    companyName: userProfile?.company_name,
    email: authUser.email,
    role: authUser.role || 'student'
  };

  // Parse request body
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const data = body ? JSON.parse(body) : {};
      const message = String(data.message || '').trim();

      if (!message) {
        return sendJSON(400, {
          success: false,
          error: 'Empty message',
          response: 'Please enter a message.'
        });
      }

      // Handle special requests
      if (message === '__INIT__' || message === 'init') {
        const role = enhancedUser.role;
        const userName = enhancedUser.name || 'User';
        return sendJSON(200, {
          success: true,
          type: 'init',
          welcome: aiRoleContext.getWelcomeMessage(role, userName),
          role,
          quickActions: aiRoleContext.getQuickActions(role),
          permissions: aiRoleContext.getPermissions(role)
        });
      }

      if (message === '__QUICK_ACTIONS__') {
        return sendJSON(200, {
          success: true,
          type: 'quickActions',
          quickActions: aiRoleContext.getQuickActions(enhancedUser.role),
          role: enhancedUser.role
        });
      }

      // Process AI chat
      const result = await handleAIChat(
        null, // db object - null for now, uses fallback data
        enhancedUser,
        message,
        {
          role: enhancedUser.role,
          portal: data.portal,
          currentPage: data.currentPage
        }
      );

      // Handle legacy fallback responses for compatibility
      if (!result.response || result.response.includes('LLM')) {
        const fallbackResponse = generateFallbackResponse(enhancedUser, message, data);
        return sendJSON(200, {
          success: true,
          response: fallbackResponse,
          role: enhancedUser.role,
          intent: aiRoleContext.parseIntentFromQuery(message, enhancedUser.role)
        });
      }

      return sendJSON(result.success ? 200 : 400, result);
    } catch (err) {
      console.error('AI Chat Error:', err);
      return sendJSON(500, {
        success: false,
        error: 'Server error',
        response: 'An error occurred. Please try again.'
      });
    }
  });
}

/**
 * Fallback response generator using existing SkillBridge data
 * This maintains compatibility while AI system is being integrated
 */
function generateFallbackResponse(user, message, data) {
  const role = user.role;
  const q = message.toLowerCase();

  if (role === 'student') {
    // Student responses using existing state data
    if (q.includes('skill') || q.includes('competenc')) {
      const skills = getStudentSkillSet(user.id);
      return `Your current skills: ${skills.map(s => s.name).join(', ') || 'No skills added yet'}. Focus on adding relevant projects to strengthen your profile.`;
    }

    if (q.includes('career') || q.includes('role') || q.includes('job')) {
      const analysis = buildSkillAnalysis(user.id);
      const topSkills = analysis.skills.slice(0, 3).map(s => s.skillName).join(', ');
      return `Based on your skills (${topSkills}), consider roles like Full Stack Developer, Backend Engineer, or Data Analyst.`;
    }

    if (q.includes('profile') || q.includes('improve') || q.includes('analyze')) {
      const profile = state.studentProfiles[user.id];
      return `Your profile completeness: ${profile?.cgpa ? '70%' : '50%'}. Recommendations: Complete your CGPA, add more projects, and upload relevant certificates.`;
    }

    if (q.includes('certificat')) {
      const certs = Object.values(state.certificates || {}).filter(c => c.user_id === user.id);
      return `Certificates found: ${certs.length || 0}. Consider adding AWS, Google Cloud, or industry-recognized certifications to boost your profile.`;
    }

    return `I'm your Career Assistant. Ask me about your skills, certificates, career suggestions, or how to improve your profile.`;
  }

  if (role === 'company') {
    if (q.includes('find') || q.includes('search') || q.includes('student') || q.includes('candidate')) {
      const allSkills = new Set();
      Object.values(state.userSkills || {}).forEach(userSkills => {
        userSkills?.forEach(s => allSkills.add(s.skill_name));
      });
      
      // Extract skills from query
      const foundSkills = [...allSkills].filter(skill => 
        q.includes(skill.toLowerCase())
      );

      if (foundSkills.length > 0) {
        return `I found candidates with skills: ${foundSkills.join(', ')}. Would you like me to rank them by skill match, show their certificates, or compare specific candidates?`;
      }

      return `I can help you find candidates. Specify skills (Python, Java, React, etc.), department, CGPA range, or job title to narrow down your search.`;
    }

    if (q.includes('rank') || q.includes('best') || q.includes('compare')) {
      return `I can rank candidates based on: Skill Match (40%) + Certificates (25%) + Projects (20%) + AI Score (15%). Provide your job requirements and I'll generate a ranking.`;
    }

    if (q.includes('interview') || q.includes('question')) {
      return `I can suggest technical interview questions. Provide the job role and required skills, and I'll generate relevant questions.`;
    }

    return `I'm your Recruitment Assistant. Ask me to find candidates, analyze job requirements, rank candidates, or compare profiles.`;
  }

  if (role === 'college') {
    if (q.includes('student')) {
      const students = Object.values(state.studentProfiles || {}).length;
      return `Your college has ${students} registered students. I can show you top performers, skill distributions, or placement-ready candidates.`;
    }

    if (q.includes('skill') || q.includes('competenc') || q.includes('gap')) {
      return `I can analyze skill gaps across departments. Which department would you like me to analyze? (CSE, IT, Mechanical, etc.)`;
    }

    if (q.includes('placement') || q.includes('ready') || q.includes('recruit')) {
      return `I can identify placement-ready students based on CGPA, skills, certificates, and projects. Would you like department-wise or overall analysis?`;
    }

    if (q.includes('department') || q.includes('cse') || q.includes('it')) {
      return `I can provide department-wise analytics including skill distributions, top performers, and placement trends.`;
    }

    return `I'm your Academic Assistant. Ask me about students, skills, placement readiness, or department analytics.`;
  }

  if (role === 'admin') {
    if (q.includes('stat') || q.includes('user') || q.includes('metric') || q.includes('overview')) {
      const students = Object.keys(state.studentProfiles || {}).length;
      const companies = Object.keys(state.companyProfiles || {}).length;
      const colleges = Object.keys(state.collegeProfiles || {}).length;
      return `Platform Statistics:\n- Active Students: ${students}\n- Companies: ${companies}\n- Colleges: ${colleges}\n- Total Skills Tracked: ${Object.keys(state.userSkills || {}).length}`;
    }

    return `I'm your Platform Assistant. Ask me about platform statistics, user activity, or placement trends.`;
  }

  // Default response
  return `Hello! I'm the SkillBridge AI Assistant. How can I help you today?`;
}

// ============================================================================
// END OF /api/ai/chat ENDPOINT
// ============================================================================

/**
 * Helper functions already in server.js
 * These are referenced in the code above - ensure they exist
 */

// Verify these functions exist in server.js:
// - requireStudent() - validates student authentication
// - verifyToken(token) - validates JWT token
// - sendJSON(code, data) - sends JSON response
// - buildSkillAnalysis(userId) - builds skill analysis
// - getStudentSkillSet(userId) - retrieves student skills
// - parseJSON(req) - parses request body

// If they don't exist, add them based on the patterns in your existing code.
