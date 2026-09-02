/**
 * SkillBridge AI Chat - API Integration Module
 * Integrates role-aware AI chat into existing server.js
 * 
 * Usage in server.js:
 * const aiChatAPI = require('./ai-chat-api');
 * // Inside the request handler:
 * if (pathname === '/api/ai/chat' && req.method === 'POST') {
 *   return aiChatAPI.handleChatRequest(db, req, res, authUser);
 * }
 */

const {
  getSystemPrompt,
  getPermissions,
  getWelcomeMessage,
  getQuickActions,
  parseIntentFromQuery
} = require('./ai-role-context');

const { handleAIChat } = require('./ai-chat-handler');

/**
 * Parse JSON from request body
 */
async function parseJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Main AI Chat Request Handler
 * This replaces/enhances the existing /api/ai/chat endpoint
 */
async function handleChatRequest(db, req, res, authUser, parseJSONFunc, sendJSONFunc) {
  // Use provided functions or default ones
  const parseJSON = parseJSONFunc || parseJSON;
  const sendJSON = sendJSONFunc || ((code, data) => sendJSONFunc(res, code, data));

  try {
    // Validate authentication
    if (!authUser) {
      return sendJSON(res, 401, {
        success: false,
        error: 'Unauthorized',
        response: 'You must be logged in to use the AI Assistant.'
      });
    }

    // Parse request body
    let body;
    try {
      body = await parseJSON(req);
    } catch (err) {
      return sendJSON(res, 400, {
        success: false,
        error: 'Invalid request',
        response: 'Please provide a valid JSON message.'
      });
    }

    const message = String(body.message || '').trim();
    if (!message) {
      return sendJSON(res, 400, {
        success: false,
        error: 'Empty message',
        response: 'Please enter a message to continue.'
      });
    }

    // Check for special requests (welcome, quick actions)
    if (message === '__INIT__' || message === 'init') {
      return handleInitRequest(res, authUser, sendJSON);
    }

    if (message === '__QUICK_ACTIONS__') {
      return handleQuickActionsRequest(res, authUser, sendJSON);
    }

    // Process AI chat
    const result = await handleAIChat(db, authUser, message, {
      role: authUser.role,
      portal: body.portal,
      currentPage: body.currentPage
    });

    return sendJSON(res, result.success ? 200 : 400, result);
  } catch (err) {
    console.error('AI Chat Error:', err);
    return sendJSON(res, 500, {
      success: false,
      error: 'Server error',
      response: 'An error occurred while processing your request. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * Handle initialization request - return welcome message and quick actions
 */
function handleInitRequest(res, authUser, sendJSON) {
  const role = authUser.role || 'student';
  const userName = authUser.name || authUser.companyName || authUser.collegeName || 'User';

  return sendJSON(res, 200, {
    success: true,
    type: 'init',
    welcome: getWelcomeMessage(role, userName),
    role,
    quickActions: getQuickActions(role),
    permissions: getPermissions(role)
  });
}

/**
 * Handle quick actions request
 */
function handleQuickActionsRequest(res, authUser, sendJSON) {
  const role = authUser.role || 'student';

  return sendJSON(res, 200, {
    success: true,
    type: 'quickActions',
    quickActions: getQuickActions(role),
    role
  });
}

/**
 * Get AI Chat Status and Health Check
 */
async function getChatStatus(db, res, sendJSON) {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseHealth(db);
    const features = {
      student: ['Profile Analysis', 'Skill Assessment', 'Career Guidance', 'Skill Gap Analysis'],
      company: ['Candidate Search', 'Skill Matching', 'Candidate Ranking', 'Job Matching'],
      college: ['Student Analytics', 'Placement Tracking', 'Skill Gap Analysis', 'Department Insights'],
      admin: ['Platform Statistics', 'User Activity', 'Skill Trends', 'Placement Reports']
    };

    return sendJSON(res, 200, {
      status: dbHealthy ? 'operational' : 'degraded',
      database: dbHealthy ? 'connected' : 'unavailable',
      features,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return sendJSON(res, 503, {
      status: 'unavailable',
      error: 'Service unavailable',
      message: 'The AI Chat service is temporarily unavailable'
    });
  }
}

/**
 * Check database health
 */
async function checkDatabaseHealth(db) {
  if (!db) return false;
  try {
    // Perform a simple query to check connection
    await db.get('SELECT 1');
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Format response for different client types
 */
function formatResponse(result, format = 'default') {
  if (format === 'markdown') {
    return {
      ...result,
      response: result.response // Client can parse markdown
    };
  }

  if (format === 'html') {
    // Convert to HTML formatting if needed
    return {
      ...result,
      response: result.response
    };
  }

  return result;
}

/**
 * Log chat interaction for analytics
 */
function logChatInteraction(userId, role, message, response) {
  // TODO: Implement chat history logging
  // Store in database for analytics and debugging
  console.log(`[AI Chat] User ${userId} (${role}): "${message.slice(0, 50)}..."`);
}

/**
 * Rate limit check
 */
function checkRateLimit(userId) {
  // TODO: Implement rate limiting
  // Check if user has exceeded API call limits
  return true; // Allow all for now
}

module.exports = {
  handleChatRequest,
  handleInitRequest,
  handleQuickActionsRequest,
  getChatStatus,
  checkDatabaseHealth,
  formatResponse,
  logChatInteraction,
  checkRateLimit,
  parseJSON,
  sendJSON
};
