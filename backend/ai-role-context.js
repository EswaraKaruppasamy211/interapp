/**
 * SkillBridge AI - Role-Aware Context & System Prompts
 * Manages role-specific behavior and database integration for AI assistant
 */

// System prompts for each role
const SYSTEM_PROMPTS = {
  student: `You are "SkillBridge Student Career Assistant" - a dedicated AI assistant for students on the SkillBridge platform.

Your capabilities:
- Analyze the logged-in student's profile, skills, certificates, projects, and resume
- Provide personalized career guidance and improvement recommendations
- Help students understand their AI skill scores and employability
- Suggest relevant job roles based on their skills
- Recommend certificates and projects to improve their profile
- Answer questions about platform features relevant to students

Important constraints:
- NEVER reveal private information of other students (names, phone, emails, etc.)
- ONLY use actual data from the student's profile and the platform
- NEVER hallucinate or make up student data
- Focus on the logged-in student's data and public platform information
- If asked about other students, politely decline due to privacy rules
- Always ground answers in real database records

When retrieving data:
- Use the student's own profile information
- Access public skill catalogs and job requirements
- Access general platform statistics only
- Respect data privacy boundaries`,

  company: `You are "SkillBridge Recruitment Assistant" - a specialized AI for recruiters and companies on SkillBridge.

Your capabilities:
- Search and discover qualified student candidates
- Match candidates to job roles based on skills and requirements
- Rank candidates by skill fit score
- Analyze job descriptions and extract required skills
- Compare shortlisted candidates
- Provide candidate recommendations
- Generate insights about candidate quality and availability
- Help with recruitment workflow optimization

Important constraints:
- ONLY show candidates who have made their profiles visible for recruitment
- NEVER expose sensitive student data (passwords, personal details beyond public profile)
- NEVER bypass authorization - only show data the company is allowed to access
- Use actual student data from the platform database
- NEVER invent candidate information
- Always provide transparent scoring and ranking methodology
- Focus on relevant skills and qualifications

Ranking methodology:
- Match score = (matched skills % × 40) + (certificates quality × 25) + (projects relevance × 20) + (AI score × 15)
- Always explain why each candidate ranks`,

  college: `You are "SkillBridge Academic & Placement Assistant" - dedicated to university/college administrators.

Your capabilities:
- Analyze student profiles and performance across departments
- Track student skill development and achievements
- Monitor placement readiness and statistics
- Identify skill gaps across departments
- Recommend training and improvement plans
- Provide department-wise analytics and insights
- Monitor student progress and employability metrics

Important constraints:
- ONLY access students belonging to the logged-in college/university
- NEVER access data from other institutions
- Respect student privacy even within your institution
- Use actual data from the platform database
- NEVER invent statistics or student information
- Focus on actionable insights for academic and placement teams

Data you can access:
- Your institution's enrolled students
- Skill distributions within departments
- Certificate and project completion rates
- Placement statistics and trends
- AI employability scores
- Department performance metrics`,

  admin: `You are "SkillBridge Platform Administrator Assistant" - AI assistant for platform administrators.

Your capabilities:
- Provide platform-wide statistics and insights
- Monitor user activity across all roles
- Track platform growth and engagement
- Analyze skill trends across the ecosystem
- Report on placement statistics
- Monitor system health and performance
- Provide admin-level insights and reports

Important constraints:
- ONLY access information authorized for admin role
- NEVER expose sensitive credentials or security information
- NEVER reveal personal data unnecessarily
- Use actual platform data only
- NEVER hallucinate statistics
- Respect privacy even for admins

Accessible data:
- Platform statistics (total users, active users, etc.)
- Aggregated skill analytics
- Placement trends and success rates
- User activity and engagement metrics
- System health metrics
- Aggregated college and company statistics`
};

/**
 * Get role-appropriate system prompt
 */
function getSystemPrompt(role) {
  return SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.student;
}

/**
 * Define what queries each role can make
 */
const ROLE_PERMISSIONS = {
  student: {
    canSearchOwnProfile: true,
    canSearchPublicSkills: true,
    canSearchPublicJobs: true,
    canAccessJobRequirements: true,
    canSearchCertificates: true,
    canSearchPublicProjects: true,
    canAccessPlatformStats: true,
    canAccessOtherStudentProfiles: false,
    canAccessCompanyData: false,
    canAccessCollegeData: false,
    maxRecordsPerQuery: 100
  },

  company: {
    canSearchOwnProfile: true,
    canSearchStudents: true,
    canSearchSkills: true,
    canRankCandidates: true,
    canCompareCandidates: true,
    canAccessJobDescriptions: true,
    canAccessCollegeData: false,
    canAccessOtherCompanyData: false,
    canAccessSensitiveStudentData: false,
    maxRecordsPerQuery: 500
  },

  college: {
    canSearchOwnStudents: true,
    canSearchOwnCollegeData: true,
    canAnalyzeDepartments: true,
    canAccessPlacementStats: true,
    canAccessOtherCollegeData: false,
    canAccessCompanyData: false,
    canAccessStudentPhoneEmails: false,
    maxRecordsPerQuery: 1000
  },

  admin: {
    canSearchAllUsers: true,
    canAccessAllStatistics: true,
    canAccessPlatformMetrics: true,
    canAccessSecurityLogs: false,
    canAccessPasswords: false,
    canAccessTokens: false,
    maxRecordsPerQuery: 5000
  }
};

/**
 * Get permissions for a role
 */
function getPermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.student;
}

/**
 * Role-specific quick action suggestions
 */
const QUICK_ACTIONS = {
  student: [
    { label: 'Analyze My Profile', action: 'analyze_profile' },
    { label: 'My Skills', action: 'view_skills' },
    { label: 'My Certificates', action: 'view_certificates' },
    { label: 'Career Suggestions', action: 'career_suggestions' },
    { label: 'Improve My Profile', action: 'profile_improvement' }
  ],

  company: [
    { label: 'Find Candidates', action: 'search_candidates' },
    { label: 'Best Software Engineers', action: 'search_engineers' },
    { label: 'Skill Search', action: 'search_by_skill' },
    { label: 'Match Job Description', action: 'match_job_description' },
    { label: 'Compare Candidates', action: 'compare_candidates' }
  ],

  college: [
    { label: 'Student List', action: 'view_students' },
    { label: 'Top Students', action: 'top_students' },
    { label: 'Placement Ready', action: 'placement_ready' },
    { label: 'Skill Gap Analysis', action: 'skill_gap_analysis' },
    { label: 'Department Analysis', action: 'department_analysis' }
  ],

  admin: [
    { label: 'Platform Overview', action: 'platform_stats' },
    { label: 'Student Statistics', action: 'student_stats' },
    { label: 'Company Statistics', action: 'company_stats' },
    { label: 'Placement Statistics', action: 'placement_stats' },
    { label: 'Skill Gap Report', action: 'skill_gap_report' }
  ]
};

/**
 * Get quick actions for a role
 */
function getQuickActions(role) {
  return QUICK_ACTIONS[role] || QUICK_ACTIONS.student;
}

/**
 * Get role-specific welcome message
 */
function getWelcomeMessage(role, userName = 'User') {
  const messages = {
    student: `👋 Hi ${userName}! I'm your **SkillBridge Career Assistant**.
Ask me about your skills, certificates, projects, resume, or career guidance. I can help you:
- Analyze your profile and identify improvement areas
- Discover which job roles match your skills
- Recommend certificates and projects to pursue
- Explain your AI skill scores and employability rating`,

    company: `👋 Hi ${userName}! I'm your **SkillBridge Recruitment Assistant**.
I can help you find and evaluate qualified candidates. Ask me to:
- Find students matching specific skills
- Rank candidates for job roles
- Analyze job descriptions and match candidates
- Compare shortlisted candidates
- Generate candidate recommendations`,

    college: `👋 Hi ${userName}! I'm your **SkillBridge Academic & Placement Assistant**.
I can help analyze student performance and placement readiness. Ask me about:
- Student profiles and skill distributions
- Placement-ready candidates
- Department-wise skill analysis
- Student improvement recommendations
- College placement statistics`,

    admin: `👋 Hi ${userName}! I'm your **SkillBridge Platform Assistant**.
I can provide platform insights and management reports. Ask me about:
- Platform statistics and metrics
- User activity and engagement
- Skill trends across the ecosystem
- Placement success rates
- System health and performance`
  };

  return messages[role] || messages.student;
}

/**
 * Parse user query to understand intent
 */
function parseIntentFromQuery(query, role) {
  const q = query.toLowerCase();
  
  const intents = {
    student: {
      profile_analysis: /analyze|profile|assessment|status/,
      skills: /skill|competenc|technic|abili/,
      certificates: /certif|award|credential/,
      projects: /project|portfolio|work/,
      resume: /resume|cv|experience/,
      career: /career|job|role|employ|position|what.*do/,
      improvement: /improve|develop|enhance|strengthen|weak/,
      scoring: /score|rating|metric|performan/
    },

    company: {
      search_candidates: /find|search|show|list|discover/,
      skill_match: /python|java|react|node|skill/,
      rank_candidates: /best|top|rank|compare/,
      job_description: /job|role|position|requirement/,
      candidate_details: /candidate|student|profile|detail/,
      interview: /interview|question|assessment/
    },

    college: {
      view_students: /student|list|show/,
      top_performers: /top|best|highest|excel/,
      placement: /placement|ready|recruit|employ/,
      skill_analysis: /skill|competenc|gap|analysis/,
      department_stats: /department|cse|it|mech|civil/,
      improvement_plan: /improve|develop|training|recommend/
    },

    admin: {
      platform_stats: /platform|stat|user|metric|total/,
      user_activity: /activity|active|engagement|login/,
      skill_trends: /skill|trend|popular|demand/,
      placement_trends: /placement|recruit|job|success/
    }
  };

  const roleIntents = intents[role] || intents.student;
  for (const [intent, pattern] of Object.entries(roleIntents)) {
    if (pattern.test(q)) {
      return intent;
    }
  }

  return 'general_query';
}

module.exports = {
  getSystemPrompt,
  getPermissions,
  getQuickActions,
  getWelcomeMessage,
  parseIntentFromQuery,
  ROLE_PERMISSIONS
};
