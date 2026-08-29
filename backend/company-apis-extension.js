/*
  SkillBridge Company Recruiter Module — Extended APIs
  This file contains all company/recruiter-specific endpoints
  to be integrated into server.js
  
  Features:
  - Company Profile Management
  - Job Creation & Management  
  - Application/ATS Pipeline (8 stages)
  - Assessment System
  - Interview Management
  - Talent Search & Discovery
  - Offer Management
  - Recruiter Messaging
  - Campus Recruitment Drives
  - Team Member Management
  - Analytics & Reporting
*/

// ============================================================================
// COMPANY PROFILE MANAGEMENT
// ============================================================================

// GET: /api/company/profile
// Retrieve company profile and settings
if (pathname === '/api/company/profile' && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const company = state.companies.find(c => c.companyId === authUser.companyId);
  if (!company) return sendJSON(404, { error: 'Company not found' });
  
  const stats = {
    activeJobs: state.jobs.filter(j => j.companyId === authUser.companyId && j.status !== 'Closed').length,
    totalApplications: state.applications.filter(a => a.companyId === authUser.companyId).length,
    shortlisted: state.applications.filter(a => a.companyId === authUser.companyId && ['Shortlisted', 'Technical Interview', 'HR Interview', 'Final Review'].includes(a.status)).length,
    selected: state.applications.filter(a => a.companyId === authUser.companyId && a.status === 'Selected').length
  };
  
  return sendJSON(200, { company, stats, recruiters: state.teamMembers?.filter(t => t.companyId === authUser.companyId) || [] });
}

// PUT: /api/company/profile
// Update company profile
if (pathname === '/api/company/profile' && req.method === 'PUT') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const company = state.companies.find(c => c.companyId === authUser.companyId);
  if (!company) return sendJSON(404, { error: 'Company not found' });
  
  const body = await parseJSON(req);
  Object.assign(company, {
    name: body.name || company.name,
    industry: body.industry || company.industry,
    description: body.description || company.description,
    website: body.website || company.website,
    logo: body.logo || company.logo,
    foundedYear: body.foundedYear || company.foundedYear,
    companySize: body.companySize || company.companySize,
    headquarters: body.headquarters || company.headquarters,
    about: body.about || company.about,
    mission: body.mission || company.mission,
    vision: body.vision || company.vision,
    culture: body.culture || company.culture,
    benefits: body.benefits || company.benefits,
    technologiesUsed: body.technologiesUsed || company.technologiesUsed
  });
  
  return sendJSON(200, { success: true, company });
}

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

// GET: /api/company/jobs
// List all jobs for a company
if (pathname === '/api/company/jobs' && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const jobs = state.jobs.filter(j => j.companyId === authUser.companyId);
  return sendJSON(200, jobs);
}

// POST: /api/company/jobs
// Create new job
if (pathname === '/api/company/jobs' && req.method === 'POST') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const body = await parseJSON(req);
  const company = state.companies.find(c => c.companyId === authUser.companyId);
  
  const newJob = {
    id: Date.now(),
    companyId: authUser.companyId,
    company_name: company?.name || 'Company',
    title: body.title || 'Job Title',
    description: body.description || '',
    responsibilities: body.responsibilities || [],
    requirements: body.requirements || [],
    preferredQualifications: body.preferredQualifications || [],
    location: body.location || 'Remote',
    workMode: body.workMode || 'Remote', // On-site, Hybrid, Remote
    employmentType: body.employmentType || 'Full-Time', // Full-Time, Part-Time, Internship, Contract
    department: body.department || '',
    vacancies: Number(body.vacancies) || 1,
    salaryMin: body.salaryMin || 0,
    salaryMax: body.salaryMax || 0,
    salary_stipend: body.salary_stipend || '₹ 8 LPA',
    benefits: body.benefits || [],
    requiredSkills: body.requiredSkills || [],
    preferredSkills: body.preferredSkills || [],
    minCGPA: Number(body.minCGPA) || 7.0,
    min_cgpa: Number(body.min_cgpa) || Number(body.minCGPA) || 7.0,
    minExperience: Number(body.minExperience) || 0,
    degree: body.degree || 'B.E./B.Tech',
    department_requirement: body.department_requirement || 'Any',
    graduationYear: body.graduationYear || '',
    allowBacklogs: body.allowBacklogs || false,
    minAIScore: Number(body.minAIScore) || 70,
    min_ai_score: Number(body.min_ai_score) || Number(body.minAIScore) || 70,
    assessmentRequired: body.assessmentRequired !== false,
    interviewRequired: body.interviewRequired !== false,
    deadline: body.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    publishedDate: new Date().toISOString().split('T')[0],
    status: body.status || 'Draft', // Draft, Published, Closed
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  state.jobs.push(newJob);
  return sendJSON(201, { success: true, job: newJob });
}

// GET: /api/company/jobs/:id
// Get job details
if (pathname.match(/^\/api\/company\/jobs\/\d+$/) && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const jobId = Number(pathname.split('/')[4]);
  const job = state.jobs.find(j => j.id === jobId && j.companyId === authUser.companyId);
  
  if (!job) return sendJSON(404, { error: 'Job not found' });
  return sendJSON(200, job);
}

// PUT: /api/company/jobs/:id
// Update job
if (pathname.match(/^\/api\/company\/jobs\/\d+$/) && req.method === 'PUT') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const jobId = Number(pathname.split('/')[4]);
  const job = state.jobs.find(j => j.id === jobId && j.companyId === authUser.companyId);
  
  if (!job) return sendJSON(404, { error: 'Job not found' });
  
  const body = await parseJSON(req);
  Object.assign(job, body, { updatedAt: new Date().toISOString() });
  
  return sendJSON(200, { success: true, job });
}

// DELETE: /api/company/jobs/:id
// Delete job
if (pathname.match(/^\/api\/company\/jobs\/\d+$/) && req.method === 'DELETE') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const jobId = Number(pathname.split('/')[4]);
  state.jobs = state.jobs.filter(j => !(j.id === jobId && j.companyId === authUser.companyId));
  
  return sendJSON(200, { success: true });
}

// ============================================================================
// ATS PIPELINE & APPLICATION MANAGEMENT
// ============================================================================

// GET: /api/company/applications
// Get all applications for company (with filtering)
if (pathname === '/api/company/applications' && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const status = parsedUrl.searchParams.get('status');
  const jobId = parsedUrl.searchParams.get('jobId');
  
  let applications = state.applications.filter(a => a.companyId === authUser.companyId);
  if (status) applications = applications.filter(a => a.status === status);
  if (jobId) applications = applications.filter(a => a.job_id === Number(jobId));
  
  return sendJSON(200, applications);
}

// GET: /api/company/applications/kanban
// Get applications organized by pipeline stage for Kanban view
if (pathname === '/api/company/applications/kanban' && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const applications = state.applications.filter(a => a.companyId === authUser.companyId);
  const stages = ['Applied', 'Screening', 'Shortlisted', 'Assessment', 'Technical Interview', 'HR Interview', 'Final Review', 'Selected'];
  
  const kanban = {};
  stages.forEach(stage => {
    kanban[stage] = applications.filter(a => a.status === stage || a.ats_stage === stage);
  });
  
  return sendJSON(200, kanban);
}

// PUT: /api/company/applications/:id/stage
// Move application to different ATS stage
if (pathname.match(/^\/api\/company\/applications\/\d+\/stage$/) && req.method === 'PUT') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const appId = Number(pathname.split('/')[4]);
  const application = state.applications.find(a => a.id === appId && a.companyId === authUser.companyId);
  
  if (!application) return sendJSON(404, { error: 'Application not found' });
  
  const body = await parseJSON(req);
  const newStage = body.stage || body.status;
  const previousStage = application.status;
  
  application.status = newStage;
  application.ats_stage = newStage;
  application.last_updated = new Date().toISOString().split('T')[0];
  
  // Log stage transition
  if (!application.stageHistory) application.stageHistory = [];
  application.stageHistory.push({
    from: previousStage,
    to: newStage,
    timestamp: new Date().toISOString(),
    movedBy: authUser.email
  });
  
  return sendJSON(200, { success: true, application });
}

// ============================================================================
// ASSESSMENT SYSTEM
// ============================================================================

// GET: /api/company/assessments
// List all assessments for company
if (pathname === '/api/company/assessments' && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  if (!state.companyAssessments) state.companyAssessments = {};
  const assessments = state.companyAssessments[authUser.companyId] || [];
  
  return sendJSON(200, assessments);
}

// POST: /api/company/assessments
// Create new assessment
if (pathname === '/api/company/assessments' && req.method === 'POST') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  if (!state.companyAssessments) state.companyAssessments = {};
  
  const body = await parseJSON(req);
  const newAssessment = {
    id: Date.now(),
    companyId: authUser.companyId,
    title: body.title || 'Assessment',
    description: body.description || '',
    type: body.type || 'Technical', // MCQ, Technical, Coding, Aptitude, etc.
    duration: Number(body.duration) || 60,
    totalMarks: Number(body.totalMarks) || 100,
    passingScore: Number(body.passingScore) || 60,
    questions: body.questions || [],
    createdAt: new Date().toISOString()
  };
  
  if (!state.companyAssessments[authUser.companyId]) {
    state.companyAssessments[authUser.companyId] = [];
  }
  
  state.companyAssessments[authUser.companyId].push(newAssessment);
  return sendJSON(201, { success: true, assessment: newAssessment });
}

// ============================================================================
// INTERVIEW MANAGEMENT
// ============================================================================

// GET: /api/company/interviews
// List all scheduled interviews
if (pathname === '/api/company/interviews' && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  if (!state.companyInterviews) state.companyInterviews = {};
  const interviews = state.companyInterviews[authUser.companyId] || [];
  
  return sendJSON(200, interviews);
}

// POST: /api/company/interviews/schedule
// Schedule new interview
if (pathname === '/api/company/interviews/schedule' && req.method === 'POST') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  if (!state.companyInterviews) state.companyInterviews = {};
  
  const body = await parseJSON(req);
  const newInterview = {
    id: Date.now(),
    companyId: authUser.companyId,
    applicationId: body.applicationId,
    candidateName: body.candidateName || '',
    candidateEmail: body.candidateEmail || '',
    jobTitle: body.jobTitle || '',
    round: body.round || 'Technical', // Technical, HR, Behavioral, etc.
    date: body.date,
    time: body.time,
    duration: Number(body.duration) || 60,
    interviewType: body.interviewType || 'Video', // Video, In-Person, Phone
    interviewer: body.interviewer || authUser.email,
    meetingLink: body.meetingLink || '',
    status: 'Scheduled', // Scheduled, Completed, Cancelled, No-Show
    createdAt: new Date().toISOString()
  };
  
  if (!state.companyInterviews[authUser.companyId]) {
    state.companyInterviews[authUser.companyId] = [];
  }
  
  state.companyInterviews[authUser.companyId].push(newInterview);
  return sendJSON(201, { success: true, interview: newInterview });
}

// ============================================================================
// TALENT SEARCH & DISCOVERY
// ============================================================================

// GET: /api/company/candidates/search
// Search and filter candidates
if (pathname === '/api/company/candidates/search' && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const skill = parsedUrl.searchParams.get('skill');
  const minCGPA = parsedUrl.searchParams.get('minCGPA');
  const department = parsedUrl.searchParams.get('department');
  const minAIScore = parsedUrl.searchParams.get('minAIScore');
  
  const company = state.companies.find(c => c.companyId === authUser.companyId);
  
  let candidates = state.users
    .filter(u => u.role === 'student')
    .map(u => {
      const profile = state.studentProfiles[u.id] || {};
      const settings = getStudentSettings(u.id);
      
      // Respect privacy settings
      if (settings.profileVisibility === 'private' || settings.recruiterDiscovery === false) return null;
      
      const match = calculateCompanyMatch(u.id, company);
      const skills = state.userSkills[u.id] || [];
      const aiScore = calculateSkillScore(u.id);
      
      return {
        studentId: u.student_id,
        name: profile.name || 'Student',
        email: settings.showContactInfo ? u.email : '***@***.com',
        department: profile.department || '',
        cgpa: settings.showAcademicInfo ? profile.cgpa : null,
        skills: settings.showSkills ? skills.map(s => ({ name: s.skill_name, level: s.level_pct })) : [],
        aiScore: aiScore,
        matchPercentage: match.matchPercentage,
        recommendationLevel: match.recommendationLevel,
        userId: u.id
      };
    })
    .filter(Boolean);
  
  // Apply filters
  if (skill) {
    candidates = candidates.filter(c => c.skills.some(s => s.name.toLowerCase().includes(skill.toLowerCase())));
  }
  if (minCGPA) {
    candidates = candidates.filter(c => c.cgpa && c.cgpa >= Number(minCGPA));
  }
  if (department) {
    candidates = candidates.filter(c => c.department.toLowerCase().includes(department.toLowerCase()));
  }
  if (minAIScore) {
    candidates = candidates.filter(c => c.aiScore >= Number(minAIScore));
  }
  
  // Sort by match percentage
  candidates.sort((a, b) => b.matchPercentage - a.matchPercentage);
  
  return sendJSON(200, candidates);
}

// GET: /api/company/candidates/:id
// Get candidate profile details
if (pathname.match(/^\/api\/company\/candidates\/[^/]+$/) && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const studentId = pathname.split('/')[4];
  const student = state.users.find(u => u.student_id === studentId && u.role === 'student');
  
  if (!student) return sendJSON(404, { error: 'Candidate not found' });
  
  const settings = getStudentSettings(student.id);
  if (settings.profileVisibility === 'private' || settings.recruiterDiscovery === false) {
    return sendJSON(403, { error: 'This candidate has restricted their profile from recruiters' });
  }
  
  const profile = state.studentProfiles[student.id] || {};
  const company = state.companies.find(c => c.companyId === authUser.companyId);
  const match = calculateCompanyMatch(student.id, company);
  
  return sendJSON(200, {
    studentId: student.student_id,
    name: profile.name || 'Student',
    email: settings.showContactInfo ? student.email : '***@***.com',
    phone: settings.showContactInfo ? profile.phone : '***-***-****',
    profile: {
      department: profile.department,
      cgpa: settings.showAcademicInfo ? profile.cgpa : null,
      graduationYear: profile.year,
      college: profile.college
    },
    skills: settings.showSkills ? state.userSkills[student.id] || [] : [],
    projects: state.projects[student.id] || [],
    certificates: state.certificates[student.id] || [],
    internships: state.internships[student.id] || [],
    resume: state.resumes[student.id] || null,
    aiScore: calculateSkillScore(student.id),
    match: match,
    linkedinUrl: profile.linkedin_url,
    githubUrl: profile.github_url,
    portfolioUrl: profile.portfolio_url
  });
}

// ============================================================================
// OFFER MANAGEMENT
// ============================================================================

// GET: /api/company/offers
// List all offers
if (pathname === '/api/company/offers' && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  if (!state.companyOffers) state.companyOffers = {};
  return sendJSON(200, state.companyOffers[authUser.companyId] || []);
}

// POST: /api/company/offers
// Create new offer
if (pathname === '/api/company/offers' && req.method === 'POST') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  if (!state.companyOffers) state.companyOffers = {};
  
  const body = await parseJSON(req);
  const newOffer = {
    id: Date.now(),
    companyId: authUser.companyId,
    applicationId: body.applicationId,
    candidateName: body.candidateName,
    candidateEmail: body.candidateEmail,
    jobTitle: body.jobTitle,
    jobId: body.jobId,
    salary: body.salary,
    benefits: body.benefits || [],
    joiningDate: body.joiningDate,
    location: body.location,
    offerExpiryDate: body.offerExpiryDate,
    status: 'Sent', // Sent, Viewed, Accepted, Rejected, Expired
    letterContent: body.letterContent || '',
    createdAt: new Date().toISOString()
  };
  
  if (!state.companyOffers[authUser.companyId]) {
    state.companyOffers[authUser.companyId] = [];
  }
  
  state.companyOffers[authUser.companyId].push(newOffer);
  return sendJSON(201, { success: true, offer: newOffer });
}

// ============================================================================
// TEAM MEMBER MANAGEMENT
// ============================================================================

// GET: /api/company/team
// List team members
if (pathname === '/api/company/team' && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  if (!state.teamMembers) state.teamMembers = [];
  return sendJSON(200, state.teamMembers.filter(t => t.companyId === authUser.companyId));
}

// POST: /api/company/team
// Add team member
if (pathname === '/api/company/team' && req.method === 'POST') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  if (!state.teamMembers) state.teamMembers = [];
  
  const body = await parseJSON(req);
  const newMember = {
    id: Date.now(),
    companyId: authUser.companyId,
    name: body.name,
    email: body.email,
    role: body.role || 'HR_RECRUITER', // COMPANY_ADMIN, HR_RECRUITER, TECHNICAL_RECRUITER, INTERVIEWER
    department: body.department || 'HR',
    createdAt: new Date().toISOString()
  };
  
  state.teamMembers.push(newMember);
  return sendJSON(201, { success: true, member: newMember });
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

// GET: /api/company/analytics/dashboard
// Get recruitment analytics
if (pathname === '/api/company/analytics/dashboard' && req.method === 'GET') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const applications = state.applications.filter(a => a.companyId === authUser.companyId);
  const jobs = state.jobs.filter(j => j.companyId === authUser.companyId);
  
  const pipeline = {
    applied: applications.filter(a => a.status === 'Applied').length,
    screening: applications.filter(a => a.status === 'Screening').length,
    shortlisted: applications.filter(a => a.status === 'Shortlisted').length,
    assessment: applications.filter(a => a.status === 'Assessment').length,
    technicalInterview: applications.filter(a => a.status === 'Technical Interview').length,
    hrInterview: applications.filter(a => a.status === 'HR Interview').length,
    finalReview: applications.filter(a => a.status === 'Final Review').length,
    selected: applications.filter(a => a.status === 'Selected').length
  };
  
  const metrics = {
    totalApplications: applications.length,
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'Published').length,
    applicationToInterviewRatio: applications.filter(a => a.status.includes('Interview')).length / (applications.length || 1),
    interviewToSelectionRatio: pipeline.selected / (applications.filter(a => a.status.includes('Interview')).length || 1),
    timeToHire: 'N/A', // Would need timestamp data
    averageTimeInStage: {}
  };
  
  return sendJSON(200, { pipeline, metrics, jobs });
}

// ============================================================================
// CAMPUS RECRUITMENT DRIVES
// ============================================================================

// POST: /api/company/campus-drives
// Create campus recruitment drive
if (pathname === '/api/company/campus-drives' && req.method === 'POST') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  const body = await parseJSON(req);
  const company = state.companies.find(c => c.companyId === authUser.companyId);
  
  const newDrive = {
    id: Date.now(),
    companyId: authUser.companyId,
    companyName: company?.name,
    title: body.title,
    university: body.university,
    department: body.department,
    graduationYear: body.graduationYear,
    eligibility: body.eligibility || '',
    minimumCGPA: Number(body.minimumCGPA) || 7.0,
    requiredSkills: body.requiredSkills || [],
    vacancies: Number(body.vacancies) || 1,
    salaryPackage: body.salaryPackage || '',
    benefits: body.benefits || [],
    applicationDeadline: body.applicationDeadline,
    assessmentDate: body.assessmentDate,
    interviewDate: body.interviewDate,
    status: 'Draft', // Draft, Approved, Active, Completed
    registrations: [],
    createdAt: new Date().toISOString()
  };
  
  if (!state.companyCampusDrives) state.companyCampusDrives = {};
  if (!state.companyCampusDrives[authUser.companyId]) {
    state.companyCampusDrives[authUser.companyId] = [];
  }
  
  state.companyCampusDrives[authUser.companyId].push(newDrive);
  return sendJSON(201, { success: true, drive: newDrive });
}

// ============================================================================
// MESSAGING SYSTEM
// ============================================================================

// POST: /api/company/messages/send
// Send message to candidate
if (pathname === '/api/company/messages/send' && req.method === 'POST') {
  const authUser = getAuthUser();
  if (!authUser || authUser.role !== 'company') return sendJSON(401, { error: 'Company authentication required' });
  
  if (!state.messages) state.messages = [];
  
  const body = await parseJSON(req);
  const newMessage = {
    id: Date.now(),
    from: authUser.email,
    fromRole: 'company',
    to: body.recipientEmail,
    toRole: 'student',
    subject: body.subject,
    message: body.message,
    type: body.type || 'general', // general, interview_invitation, assessment_invitation, shortlist, offer, rejection
    relatedApplicationId: body.applicationId,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  state.messages.push(newMessage);
  return sendJSON(201, { success: true, message: newMessage });
}

// Export for integration
module.exports = {
  companyAPIsNote: 'Add these endpoints to server.js HTTP request handler'
};
