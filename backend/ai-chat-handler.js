/**
 * SkillBridge AI - Chat API Handler
 * Processes role-aware chat requests with database integration
 */

const {
  getSystemPrompt,
  getPermissions,
  parseIntentFromQuery
} = require('./ai-role-context');

const {
  getStudentOwnProfile,
  getStudentSkills,
  getStudentCertificates,
  getStudentProjects,
  searchCandidatesBySkills,
  getPublicCandidateProfile,
  getPublicCandidateSkills,
  getCollegeStudents,
  getPlatformStatistics,
  validateDataAccess,
  filterSensitiveData
} = require('./ai-db-queries');

/**
 * Main chat handler
 */
async function handleAIChat(db, user, message, context = {}) {
  if (!user || !message) {
    return {
      success: false,
      error: 'Invalid request',
      response: 'Please provide a valid message.'
    };
  }

  try {
    const role = user.role || 'student';
    const userId = user.id;

    // Step 1: Parse intent from message
    const intent = parseIntentFromQuery(message, role);

    // Step 2: Validate permissions
    if (!validateDataAccess(role, intent)) {
      return {
        success: false,
        error: 'Unauthorized',
        response: 'You do not have permission to perform this query.'
      };
    }

    // Step 3: Retrieve relevant data based on role and intent
    const relevantData = await retrieveRelevantData(db, role, userId, message, intent);

    // Step 4: Prepare AI context
    const aiContext = buildAIContext(role, user, relevantData, intent);

    // Step 5: Generate response
    // Note: In production, send this to your LLM API (e.g., OpenAI)
    const response = await generateAIResponse(message, aiContext, role);

    return {
      success: true,
      response,
      dataUsed: relevantData, // For debugging/transparency
      role,
      intent
    };
  } catch (err) {
    console.error('AI Chat Error:', err);
    return {
      success: false,
      error: 'Server error',
      response: 'I encountered an error processing your request. Please try again.'
    };
  }
}

/**
 * Retrieve data relevant to the query
 */
async function retrieveRelevantData(db, role, userId, message, intent) {
  const data = { intent };
  const q = message.toLowerCase();

  try {
    if (role === 'student') {
      // Student queries - focus on own profile
      if (intent.includes('profile') || intent.includes('analysis')) {
        data.profile = await getStudentOwnProfile(db, userId);
        data.skills = await getStudentSkills(db, userId);
        data.certificates = await getStudentCertificates(db, userId);
        data.projects = await getStudentProjects(db, userId);
      }
      
      if (intent.includes('skill')) {
        data.skills = await getStudentSkills(db, userId);
      }
      
      if (intent.includes('certif')) {
        data.certificates = await getStudentCertificates(db, userId);
      }
      
      if (intent.includes('project')) {
        data.projects = await getStudentProjects(db, userId);
      }
    }

    else if (role === 'company') {
      // Company queries - search candidates
      if (intent.includes('search') || intent.includes('find') || intent.includes('candidate')) {
        // Extract skills from message
        const skills = extractSkillsFromQuery(message);
        if (skills.length > 0) {
          data.candidates = await searchCandidatesBySkills(db, skills, 20);
          
          // Get detailed profiles for top candidates
          if (data.candidates && data.candidates.length > 0) {
            data.candidateDetails = await Promise.all(
              data.candidates.slice(0, 5).map(c => getPublicCandidateProfile(db, c.user_id))
            );
          }
        }
      }
      
      if (intent.includes('rank') || intent.includes('compare')) {
        data.scoringMethodology = 'Skill Match (40%) + Certificates (25%) + Projects (20%) + AI Score (15%)';
      }
    }

    else if (role === 'college') {
      // College queries - analyze students
      const collegeName = user.collegeName; // From user profile
      
      if (intent.includes('student') || intent.includes('placement')) {
        data.students = await getCollegeStudents(db, collegeName, null, 50);
      }
      
      if (intent.includes('department')) {
        // Extract department from message
        const dept = extractDepartmentFromQuery(message);
        if (dept) {
          data.departmentStudents = await getCollegeStudents(db, collegeName, dept, 50);
        }
      }
      
      if (intent.includes('skill') || intent.includes('gap')) {
        data.students = await getCollegeStudents(db, collegeName, null, 100);
      }
    }

    else if (role === 'admin') {
      // Admin queries - platform stats
      if (intent.includes('stat') || intent.includes('platform') || intent.includes('overview')) {
        data.platformStats = await getPlatformStatistics(db);
      }
    }

    return data;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return { error: err.message, intent };
  }
}

/**
 * Build context for AI processing
 */
function buildAIContext(role, user, relevantData, intent) {
  const systemPrompt = getSystemPrompt(role);
  
  let dataContext = 'The following data is available for this query:\n';
  
  if (relevantData.profile) {
    dataContext += `\nStudent Profile:\n${JSON.stringify(relevantData.profile, null, 2)}\n`;
  }
  
  if (relevantData.skills && relevantData.skills.length > 0) {
    dataContext += `\nSkills:\n${JSON.stringify(relevantData.skills, null, 2)}\n`;
  }
  
  if (relevantData.certificates && relevantData.certificates.length > 0) {
    dataContext += `\nCertificates:\n${JSON.stringify(relevantData.certificates, null, 2)}\n`;
  }
  
  if (relevantData.projects && relevantData.projects.length > 0) {
    dataContext += `\nProjects:\n${JSON.stringify(relevantData.projects, null, 2)}\n`;
  }
  
  if (relevantData.candidates && relevantData.candidates.length > 0) {
    dataContext += `\nCandidate Search Results:\n${JSON.stringify(relevantData.candidates, null, 2)}\n`;
  }
  
  if (relevantData.students && relevantData.students.length > 0) {
    dataContext += `\nStudent Data:\n${JSON.stringify(relevantData.students, null, 2)}\n`;
  }
  
  if (relevantData.platformStats) {
    dataContext += `\nPlatform Statistics:\n${JSON.stringify(relevantData.platformStats, null, 2)}\n`;
  }

  return {
    systemPrompt,
    userRole: role,
    userName: user.name || user.companyName || user.collegeName || 'User',
    dataContext,
    intent,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate AI response
 * This is a template - in production, connect to your LLM API
 */
async function generateAIResponse(userMessage, context, role) {
  // TODO: Implement actual LLM integration (OpenAI, Anthropic, etc.)
  // For now, return a template response
  
  const { systemPrompt, dataContext, intent } = context;
  
  // Build the prompt for LLM
  const fullPrompt = `${systemPrompt}\n\nRelevant Platform Data:\n${dataContext}\n\nUser Question: ${userMessage}`;
  
  // Example response based on intent
  if (role === 'student' && intent.includes('profile')) {
    return generateStudentProfileAnalysis(userMessage, context);
  }
  
  if (role === 'company' && intent.includes('candidate')) {
    return generateCandidateSearchResponse(userMessage, context);
  }
  
  if (role === 'college' && intent.includes('student')) {
    return generateStudentAnalysisResponse(userMessage, context);
  }
  
  if (role === 'admin') {
    return generateAdminInsightsResponse(userMessage, context);
  }
  
  // Default response
  return `I understood your request. Here's what I found:\n\n[Data processing in progress - LLM integration coming]`;
}

/**
 * Generate student-specific response
 */
function generateStudentProfileAnalysis(message, context) {
  const { dataContext } = context;
  
  if (!dataContext || dataContext.length === 0) {
    return 'I could not find your profile information. Please try logging in again or contact support.';
  }
  
  return `Based on your SkillBridge profile, here's my analysis:\n\n` +
    `**Profile Summary:**\nYour profile is up-to-date with all information.\n\n` +
    `**Recommendations:**\n` +
    `1. Complete additional certifications to strengthen your profile\n` +
    `2. Contribute to open-source projects to demonstrate practical skills\n` +
    `3. Update your bio with specific career goals\n\n` +
    `**Employability Score:** 78/100\n` +
    `Your profile shows strong potential. Focus on project-based learning for better placement opportunities.`;
}

/**
 * Generate company recruitment response
 */
function generateCandidateSearchResponse(message, context) {
  const { dataContext } = context;
  
  if (!dataContext || dataContext.includes('0 results')) {
    return 'I couldn\'t find candidates matching your criteria. Try adjusting your skill filters or expanding your search parameters.';
  }
  
  return `**Top Matching Candidates Found:**\n\n` +
    `I found 5 candidates matching your requirements.\n\n` +
    `**Top Matches:**\n` +
    `1. Student Name - Match Score: 92%\n   Skills: Java, Spring Boot, SQL, Docker\n   Certificates: 3\n   Projects: 4\n\n` +
    `2. Another Student - Match Score: 88%\n   Skills: Python, JavaScript, React, Node.js\n   Certificates: 4\n   Projects: 5\n\n` +
    `Would you like me to compare specific candidates or provide more details?`;
}

/**
 * Generate college analysis response
 */
function generateStudentAnalysisResponse(message, context) {
  const { dataContext } = context;
  
  if (!dataContext || dataContext.includes('0 records')) {
    return 'No student data available for your institution.';
  }
  
  return `**Student Analysis Report:**\n\n` +
    `**Statistics:**\n` +
    `- Total Students: 150\n` +
    `- Average CGPA: 7.2\n` +
    `- Placement Ready: 45 students\n` +
    `- Top Department: Computer Science\n\n` +
    `**Key Insights:**\n` +
    `- 60% of students have at least 1 certification\n` +
    `- Average skill score improved by 15% this semester\n` +
    `- Top skills: Python, Java, React\n\n` +
    `**Recommendations:**\n` +
    `- Encourage more project-based learning\n` +
    `- Organize workshops on emerging technologies`;
}

/**
 * Generate admin insights response
 */
function generateAdminInsightsResponse(message, context) {
  return `**Platform Administrator Dashboard:**\n\n` +
    `**Active Users:**\n` +
    `- Students: 5,000\n` +
    `- Companies: 150\n` +
    `- Colleges: 50\n\n` +
    `**Platform Metrics:**\n` +
    `- Total Certificates: 12,500\n` +
    `- Total Projects: 8,900\n` +
    `- Placement Success Rate: 78%\n\n` +
    `**Top Skills in Demand:**\n` +
    `1. Python\n` +
    `2. JavaScript/React\n` +
    `3. Java\n` +
    `4. SQL\n` +
    `5. AWS`;
}

/**
 * Extract skills from natural language query
 */
function extractSkillsFromQuery(message) {
  const skillKeywords = [
    'python', 'java', 'javascript', 'react', 'node.js', 'sql', 'mongodb',
    'docker', 'kubernetes', 'aws', 'c++', 'c#', 'golang', 'rust',
    'spring boot', 'django', 'flask', 'express', 'angular', 'vue.js',
    'git', 'github', 'rest api', 'graphql', 'typescript', 'golang',
    'machine learning', 'ai', 'ml', 'deep learning', 'tensorflow', 'pytorch'
  ];
  
  const found = [];
  skillKeywords.forEach(skill => {
    if (message.toLowerCase().includes(skill.toLowerCase())) {
      found.push(skill);
    }
  });
  
  return found;
}

/**
 * Extract department from query
 */
function extractDepartmentFromQuery(message) {
  const departments = [
    'Computer Science', 'CSE',
    'Information Technology', 'IT',
    'Electronics', 'ECE',
    'Mechanical', 'ME',
    'Civil',
    'Electrical', 'EEE'
  ];
  
  for (const dept of departments) {
    if (message.toLowerCase().includes(dept.toLowerCase())) {
      return dept;
    }
  }
  
  return null;
}

module.exports = {
  handleAIChat,
  retrieveRelevantData,
  buildAIContext,
  generateAIResponse,
  extractSkillsFromQuery,
  extractDepartmentFromQuery
};
