/**
 * SkillBridge AI - Database Query Layer
 * Safely retrieves role-appropriate data for AI assistant
 * Enforces permission checks and data filtering
 */

const { getPermissions } = require('./ai-role-context');

/**
 * Get student's own profile data (for student queries)
 */
async function getStudentOwnProfile(db, userId) {
  if (!db || !userId) return null;

  try {
    const profile = await db.get(`
      SELECT 
        sp.user_id,
        sp.name,
        sp.college,
        sp.university,
        sp.degree,
        sp.department,
        sp.year_of_study,
        sp.graduation_year,
        sp.cgpa,
        sp.phone,
        sp.location,
        sp.bio,
        sp.goal,
        u.email
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.user_id = ?
    `, [userId]);

    return profile || null;
  } catch (err) {
    console.error('Error fetching student profile:', err);
    return null;
  }
}

/**
 * Get student's skills (from the application)
 */
async function getStudentSkills(db, userId) {
  if (!db || !userId) return [];

  try {
    // Adjust based on actual schema - this is a template
    const skills = await db.all(`
      SELECT DISTINCT skill_name as name, proficiency_level, years_of_experience
      FROM user_skills
      WHERE user_id = ?
      ORDER BY proficiency_level DESC
    `, [userId]);

    return skills || [];
  } catch (err) {
    console.error('Error fetching student skills:', err);
    return [];
  }
}

/**
 * Get student's certificates
 */
async function getStudentCertificates(db, userId) {
  if (!db || !userId) return [];

  try {
    // Adjust based on actual schema
    const certs = await db.all(`
      SELECT id, name, organization, issue_date, credential_id, credential_url
      FROM certificates
      WHERE user_id = ?
      ORDER BY issue_date DESC
    `, [userId]);

    return certs || [];
  } catch (err) {
    console.error('Error fetching certificates:', err);
    return [];
  }
}

/**
 * Get student's projects
 */
async function getStudentProjects(db, userId) {
  if (!db || !userId) return [];

  try {
    const projects = await db.all(`
      SELECT id, title, description, skills_used, github_url, project_url, completion_date
      FROM projects
      WHERE user_id = ?
      ORDER BY completion_date DESC
    `, [userId]);

    return projects || [];
  } catch (err) {
    console.error('Error fetching projects:', err);
    return [];
  }
}

/**
 * Search candidates by skills (for company queries)
 * Filters only students with public recruitment profiles
 */
async function searchCandidatesBySkills(db, skillNames = [], limit = 20) {
  if (!db || !skillNames || skillNames.length === 0) return [];

  try {
    // Build skill matching query - adjust based on actual schema
    const placeholders = skillNames.map(() => '?').join(',');
    
    const candidates = await db.all(`
      SELECT 
        sp.user_id,
        sp.name,
        sp.department,
        sp.college,
        COUNT(DISTINCT us.skill_name) as matched_skills_count,
        GROUP_CONCAT(us.skill_name, ', ') as matched_skills
      FROM student_profiles sp
      LEFT JOIN user_skills us ON sp.user_id = us.user_id
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.portfolio_visibility = 'public'
        AND u.is_active = 1
        AND LOWER(us.skill_name) IN (${placeholders})
      GROUP BY sp.user_id
      ORDER BY matched_skills_count DESC
      LIMIT ?
    `, [...skillNames.map(s => s.toLowerCase()), limit]);

    return candidates || [];
  } catch (err) {
    console.error('Error searching candidates by skills:', err);
    return [];
  }
}

/**
 * Get public candidate profile (company accessing student)
 * Only returns public information
 */
async function getPublicCandidateProfile(db, userId) {
  if (!db || !userId) return null;

  try {
    const profile = await db.get(`
      SELECT 
        sp.user_id,
        sp.name,
        sp.college,
        sp.department,
        sp.graduation_year,
        sp.cgpa,
        sp.location,
        sp.bio,
        sp.goal,
        (SELECT COUNT(*) FROM certificates WHERE user_id = sp.user_id) as certificate_count,
        (SELECT COUNT(*) FROM projects WHERE user_id = sp.user_id) as project_count
      FROM student_profiles sp
      WHERE sp.user_id = ?
        AND sp.portfolio_visibility = 'public'
    `, [userId]);

    return profile || null;
  } catch (err) {
    console.error('Error fetching public candidate profile:', err);
    return null;
  }
}

/**
 * Get candidate's public skills (company accessing)
 */
async function getPublicCandidateSkills(db, userId) {
  if (!db || !userId) return [];

  try {
    const skills = await db.all(`
      SELECT DISTINCT skill_name as name, proficiency_level
      FROM user_skills
      WHERE user_id = ? AND proficiency_level IN ('Advanced', 'Expert', 'Intermediate')
      ORDER BY proficiency_level DESC
      LIMIT 20
    `, [userId]);

    return skills || [];
  } catch (err) {
    console.error('Error fetching public candidate skills:', err);
    return [];
  }
}

/**
 * Get all students from a college (for college queries)
 */
async function getCollegeStudents(db, collegeId, departmentFilter = null, limit = 100) {
  if (!db || !collegeId) return [];

  try {
    let query = `
      SELECT 
        sp.user_id,
        sp.name,
        sp.department,
        sp.year_of_study,
        sp.cgpa,
        (SELECT COUNT(*) FROM certificates WHERE user_id = sp.user_id) as certificate_count,
        (SELECT COUNT(*) FROM projects WHERE user_id = sp.user_id) as project_count
      FROM student_profiles sp
      WHERE (sp.college = ? OR sp.university = ?)
    `;
    
    const params = [collegeId, collegeId];

    if (departmentFilter) {
      query += ` AND LOWER(sp.department) LIKE LOWER(?)`;
      params.push(`%${departmentFilter}%`);
    }

    query += ` ORDER BY sp.cgpa DESC LIMIT ?`;
    params.push(limit);

    const students = await db.all(query, params);
    return students || [];
  } catch (err) {
    console.error('Error fetching college students:', err);
    return [];
  }
}

/**
 * Get platform statistics (for admin queries)
 */
async function getPlatformStatistics(db) {
  if (!db) return {};

  try {
    const stats = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = 1) as active_students,
        (SELECT COUNT(*) FROM users WHERE role = 'company' AND is_active = 1) as active_companies,
        (SELECT COUNT(*) FROM users WHERE role = 'college' AND is_active = 1) as active_colleges,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_active_users,
        (SELECT COUNT(*) FROM certificates) as total_certificates,
        (SELECT COUNT(*) FROM projects) as total_projects
    `);

    return stats || {};
  } catch (err) {
    console.error('Error fetching platform statistics:', err);
    return {};
  }
}

/**
 * Validate that user has permission to access data
 * Returns true if access is allowed
 */
function validateDataAccess(userRole, queryType, targetUserId = null, userCollegeId = null) {
  const perms = getPermissions(userRole);

  // Define what each role can query
  const allowedQueries = {
    student: ['search_own_profile', 'search_public_skills', 'search_public_jobs', 'search_certificates'],
    company: ['search_students', 'search_skills', 'rank_candidates', 'analyze_job'],
    college: ['search_own_students', 'search_own_college', 'analyze_departments'],
    admin: ['search_all', 'platform_stats', 'user_activity', 'skill_trends']
  };

  return allowedQueries[userRole]?.includes(queryType) || false;
}

/**
 * Filter sensitive data from results before sending to AI
 */
function filterSensitiveData(data, userRole) {
  if (!data) return null;

  if (Array.isArray(data)) {
    return data.map(record => filterSensitiveDataFromRecord(record, userRole));
  }

  return filterSensitiveDataFromRecord(data, userRole);
}

/**
 * Remove sensitive fields from a single record
 */
function filterSensitiveDataFromRecord(record, userRole) {
  if (!record) return null;

  const filtered = { ...record };

  // Always remove sensitive fields
  delete filtered.password_hash;
  delete filtered.salt;

  // Remove phone and email based on role
  if (userRole === 'company') {
    delete filtered.phone;
    delete filtered.email;
  }

  if (userRole === 'college') {
    delete filtered.email; // Colleges can see internal phone
  }

  return filtered;
}

module.exports = {
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
};
