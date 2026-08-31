// SkillBridge Talent Finder - Real Matching Engine
// Performs skill-based matching between students and job requirements

/**
 * Calculate match percentage for a student against job requirements
 */
function calculateStudentJobMatch(student, job, userSkills = []) {
  let matchedSkills = [];
  let missedRequiredSkills = [];
  let totalPoints = 0;
  let earnedPoints = 0;

  // Get student's skill scores (normalize to 0-100)
  const studentSkillMap = {};
  userSkills.forEach(skill => {
    const skillKey = (skill.skill_name || skill.name || '').toLowerCase().trim();
    const scorePercentage = Number(skill.level_pct || 0);
    studentSkillMap[skillKey] = scorePercentage;
  });

  // Match required skills
  const requiredSkills = job.required_skills || [];
  requiredSkills.forEach(req => {
    const reqSkillKey = (req.name || req).toLowerCase().trim();
    const reqLevel = Number(req.minimum_level || req.level || 70);
    
    totalPoints += 30; // Each required skill worth 30 points
    
    if (studentSkillMap[reqSkillKey] !== undefined) {
      const studentLevel = studentSkillMap[reqSkillKey];
      if (studentLevel >= reqLevel) {
        earnedPoints += 30;
        matchedSkills.push({ skill: reqSkillKey, student: studentLevel, required: reqLevel, match: true });
      } else {
        missedRequiredSkills.push({ skill: reqSkillKey, gap: reqLevel - studentLevel });
      }
    } else {
      missedRequiredSkills.push({ skill: reqSkillKey, gap: reqLevel });
    }
  });

  // CGPA matching (if requirement exists)
  const minCGPA = Number(job.min_cgpa || 0);
  const studentCGPA = Number(student.cgpa || 0);
  
  if (minCGPA > 0) {
    totalPoints += 20;
    if (studentCGPA >= minCGPA) {
      earnedPoints += 20;
      matchedSkills.push({ criteria: 'CGPA', student: studentCGPA, required: minCGPA, match: true });
    } else {
      missedRequiredSkills.push({ criteria: 'CGPA', gap: minCGPA - studentCGPA });
    }
  }

  // Department matching (if requirement exists)
  const requiredDepartment = job.department || '';
  const studentDepartment = (student.department || '').toLowerCase().trim();
  
  if (requiredDepartment) {
    totalPoints += 15;
    const deptMatch = studentDepartment.toLowerCase().includes(requiredDepartment.toLowerCase());
    if (deptMatch) {
      earnedPoints += 15;
      matchedSkills.push({ criteria: 'Department', value: studentDepartment, required: requiredDepartment, match: true });
    }
  }

  // Graduation year matching (if requirement exists)
  const requiredGradYear = Number(job.graduation_year || 0);
  const studentGradYear = Number(student.graduation_year || 0);
  
  if (requiredGradYear > 0) {
    totalPoints += 10;
    if (studentGradYear >= requiredGradYear) {
      earnedPoints += 10;
      matchedSkills.push({ criteria: 'Graduation Year', year: studentGradYear, required: requiredGradYear, match: true });
    }
  }

  // Calculate overall match percentage
  const matchPercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  
  // Determine recommendation level
  let recommendationLevel = 'Poor Match';
  if (matchPercentage >= 90) {
    recommendationLevel = 'Perfect Match! ⭐';
  } else if (matchPercentage >= 75) {
    recommendationLevel = 'Strong Match ✓';
  } else if (matchPercentage >= 60) {
    recommendationLevel = 'Good Match';
  } else if (matchPercentage >= 40) {
    recommendationLevel = 'Fair Match';
  }

  return {
    matchPercentage,
    recommendationLevel,
    matched: matchedSkills,
    gaps: missedRequiredSkills,
    strengths: matchedSkills.slice(0, 3).map(m => m.skill || m.criteria).join(', '),
    skillGaps: missedRequiredSkills.slice(0, 3).map(g => g.skill || g.criteria).join(', ')
  };
}

/**
 * Find matching students for a job
 */
function findMatchingStudentsForJob(job, allStudents = [], studentSkillsMap = {}) {
  const matches = [];

  allStudents.forEach(student => {
    // Check if student is eligible (not private profile, recruiter discovery enabled)
    // This check should be done in the API layer based on privacy settings

    const studentSkills = studentSkillsMap[student.id] || [];
    const matchResult = calculateStudentJobMatch(student, job, studentSkills);

    if (matchResult.matchPercentage >= 40) { // Only include matches >= 40%
      matches.push({
        studentId: student.student_id,
        name: student.name,
        department: student.department,
        cgpa: student.cgpa,
        match: matchResult
      });
    }
  });

  // Sort by match percentage descending
  return matches.sort((a, b) => b.match.matchPercentage - a.match.matchPercentage);
}

/**
 * Determine if a student is eligible for a job based on requirements
 */
function isStudentEligibleForJob(student, job, userSkills = []) {
  const match = calculateStudentJobMatch(student, job, userSkills);
  
  // Student is eligible if match percentage is >= 60%
  return match.matchPercentage >= 60;
}

/**
 * Find all eligible jobs for a student
 */
function findEligibleJobsForStudent(student, allJobs = [], userSkills = []) {
  const eligibleJobs = [];

  allJobs.forEach(job => {
    const match = calculateStudentJobMatch(student, job, userSkills);
    
    if (match.matchPercentage >= 60) {
      eligibleJobs.push({
        jobId: job.id,
        title: job.title,
        company: job.company_name,
        match: match
      });
    }
  });

  // Sort by match percentage descending
  return eligibleJobs.sort((a, b) => b.match.matchPercentage - a.match.matchPercentage);
}

/**
 * Generate notification list for a job (students who should be notified)
 */
function generateNotificationListForJob(job, allStudents = [], studentSkillsMap = {}, privacySettingsMap = {}) {
  const notificationList = [];

  const matchingStudents = findMatchingStudentsForJob(job, allStudents, studentSkillsMap);

  matchingStudents.forEach(match => {
    const privacySettings = privacySettingsMap[match.studentId] || {};
    
    // Check privacy settings
    const shouldNotify = 
      privacySettings.profileVisibility !== 'private' &&
      privacySettings.recruiterDiscovery !== false;

    if (shouldNotify && match.match.matchPercentage >= 70) { // Only notify for strong matches
      notificationList.push({
        studentId: match.studentId,
        studentName: match.name,
        matchScore: match.match.matchPercentage,
        jobId: job.id,
        jobTitle: job.title,
        message: `We found a ${match.match.recommendationLevel} opportunity for you at ${job.company_name}`
      });
    }
  });

  return notificationList;
}

module.exports = {
  calculateStudentJobMatch,
  findMatchingStudentsForJob,
  isStudentEligibleForJob,
  findEligibleJobsForStudent,
  generateNotificationListForJob
};
