// SkillBridge — Enforced Security Client Engine for Student, Company & College Modules

const API_BASE = 'https://interview-wc6b.onrender.com/api';

let currentUser = null;
let currentProfile = null;
let currentRole = 'student';
let authToken = localStorage.getItem('sb_token') || null;
let pendingStudentOtpEmail = null;
let voiceInterview = {
  language: 'ta-IN',
  questionIndex: 0,
  answers: [],
  recognition: null,
  listening: false,
  sessionStarted: false,
  lastTranscript: ''
};

const interviewQuestions = [
  { en: 'Tell me about yourself and the kind of software role you are looking for.', ta: 'உங்களைப் பற்றியும் நீங்கள் தேடும் மென்பொருள் பணியைப் பற்றியும் சொல்லுங்கள்.' },
  { en: 'Explain one project you built and the most important technical decision you made.', ta: 'நீங்கள் உருவாக்கிய ஒரு திட்டத்தையும் அதில் எடுத்த முக்கியமான தொழில்நுட்ப முடிவையும் விளக்குங்கள்.' },
  { en: 'How would you debug an API that suddenly became slow in production?', ta: 'Production-ல் திடீரென மெதுவான API-யை எப்படி debug செய்வீர்கள்?' },
  { en: 'Describe a time you solved a difficult problem with a teammate.', ta: 'ஒரு குழு உறுப்பினருடன் சேர்ந்து கடினமான பிரச்சினையைத் தீர்த்த அனுபவத்தைச் சொல்லுங்கள்.' },
  { en: 'Why should we select you for this role?', ta: 'இந்த பணிக்கு உங்களை ஏன் தேர்வு செய்ய வேண்டும்?' }
];

document.addEventListener('DOMContentLoaded', async () => {
  const transcript = document.getElementById('interview-transcript');
  if (transcript) {
    transcript.addEventListener('input', updateInterviewAnswerState);
  }

  if (authToken) {
    await fetchCurrentUser();
  } else {
    showGuestLanding();
  }
});

async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Request Failed');
    return data;
  } catch (err) {
    console.error('API Error:', err.message);
    throw err;
  }
}

async function fetchCurrentUser() {
  try {
    const data = await apiFetch('/auth/me');
    currentUser = data.user;
    currentProfile = data.profile;
    currentRole = currentUser.role || 'student';
    showAppWorkspace();
  } catch (err) {
    handleLogout();
  }
}

function showGuestLanding() {
  document.getElementById('guest-landing').classList.remove('hidden');
  document.getElementById('app-workspace').classList.add('hidden');
  document.getElementById('guest-nav-controls').classList.remove('hidden');
  document.getElementById('user-nav-controls').classList.add('hidden');
}

function showAppWorkspace() {
  document.getElementById('guest-landing').classList.add('hidden');
  document.getElementById('app-workspace').classList.remove('hidden');
  document.getElementById('guest-nav-controls').classList.add('hidden');
  document.getElementById('user-nav-controls').classList.remove('hidden');

  const name = (currentProfile && currentProfile.name) || (currentUser && currentUser.companyName) || (currentUser && currentUser.collegeName) || 'User';
  document.getElementById('user-display-name').textContent = name;
  document.getElementById('user-display-id').textContent = currentUser.role === 'company' ? `COMPANY (${currentUser.companyId || 'CMP-10001'})` : (currentUser.role === 'college' ? 'UNIVERSITY ADMIN' : (currentProfile ? currentProfile.student_id : 'STUDENT'));

  renderPortalState(currentRole);
  if (currentRole === 'student' && currentProfile && currentProfile.onboarding_complete === false) navigateTo('profile');
}

// ENFORCED SECURITY PORTAL SWITCHER & ROUTE GUARDS
function switchPortalRole(targetRole) {
  if (targetRole === 'student' && (!currentUser || currentUser.role !== 'student')) {
    openStudentAuthModal('login');
    return;
  }

  if (targetRole === 'company' && (!currentUser || currentUser.role !== 'company')) {
    openCompanyAuthModal('login');
    return;
  }

  if (targetRole === 'college' && (!currentUser || currentUser.role !== 'college')) {
    openCollegeAuthModal('login');
    return;
  }

  currentRole = targetRole;
  renderPortalState(targetRole);
}

function renderPortalState(role) {
  document.querySelectorAll('.role-nav-pill').forEach(el => el.classList.remove('active'));
  const pill = document.getElementById(`portal-pill-${role}`);
  if (pill) pill.classList.add('active');

  const badge = document.getElementById('portal-badge');
  if (badge) badge.textContent = role === 'company' ? 'Recruiter Module' : (role === 'college' ? 'University Admin' : 'Student Module');

  document.querySelectorAll('.role-sidebar-group').forEach(group => group.classList.add('hidden'));
  const targetGroup = document.getElementById(`sidebar-${role}-links`);
  if (targetGroup) targetGroup.classList.remove('hidden');

  if (role === 'student') navigateTo('dashboard');
  else if (role === 'company') navigateTo('company-dashboard');
  else if (role === 'college') navigateTo('college-dashboard');
}

function navigateToRoleHome() {
  switchPortalRole(currentRole);
}

function navigateTo(viewId) {
  if (viewId === 'dashboard' && currentRole === 'student' && currentProfile && currentProfile.onboarding_complete === false) {
    viewId = 'profile';
  }
  closeMobileDrawer();

  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.querySelector(`.sidebar-item[data-target="${viewId}"]`);
  if (activeItem) activeItem.classList.add('active');

  document.querySelectorAll('.workspace-view').forEach(v => v.classList.add('hidden'));
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) targetView.classList.remove('hidden');

  if (viewId === 'dashboard') loadDashboardHome();
  else if (viewId === 'profile') loadProfileView();
  else if (viewId === 'academics') loadAcademicsView();
  else if (viewId === 'skills') loadSkillsView();
  else if (viewId === 'certificates') loadCertificatesView();
  else if (viewId === 'assessments') loadAssessmentsView();
  else if (viewId === 'portfolio') loadPortfolioView();
  else if (viewId === 'ai-skill-analyzer') loadAISkillAnalyzerView();
  else if (viewId === 'skill-map') loadSkillMapView();
  else if (viewId === 'opportunities') loadOpportunitiesView();
  else if (viewId === 'applications') loadApplicationsView();
  else if (viewId === 'interview-prep') loadInterviewPrepView();
  else if (viewId === 'notifications') loadNotificationsView();
  else if (viewId === 'campus-drives') loadCampusDrivesView();
  else if (viewId === 'placement') loadPlacementView();
  else if (viewId === 'settings') loadSettingsView();
  else if (viewId === 'company-dashboard') loadCompanyATSPipeline();
  else if (viewId === 'talent-finder') loadTalentFinder();
  else if (viewId === 'college-dashboard') loadCollegeDashboard();
  else if (viewId === 'college-students') loadCollegeStudentDirectory();
}

// STUDENT AUTH HANDLERS
function openStudentAuthModal(tab = 'login') {
  openModal('student-auth-modal');
  switchStudentAuthTab(tab);
}

function switchStudentAuthTab(tab) {
  const loginForm = document.getElementById('student-login-form');
  const regForm = document.getElementById('student-register-form');
  const title = document.getElementById('student-auth-title');

  if (tab === 'login') {
    title.innerHTML = '<i class="fa-solid fa-graduation-cap text-blue"></i> Student Sign In';
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
  } else {
    title.innerHTML = '<i class="fa-solid fa-user-plus text-blue"></i> Register Student Account';
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

async function handleStudentLoginSubmit(e) {
  e.preventDefault();
  const identity = document.getElementById('stu-login-id').value.trim();
  const password = document.getElementById('stu-login-pass').value.trim();

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identity, password, role: 'student' })
    });
    authToken = data.token;
    localStorage.setItem('sb_token', authToken);
    currentUser = data.user;
    currentProfile = data.profile;
    closeModal('student-auth-modal');
    switchPortalRole('student');
    showAppWorkspace();
  } catch (err) {
    alert(err.message || 'Student Sign In Failed.');
  }
}

async function handleStudentRegisterSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('stu-reg-name').value.trim();
  const username = document.getElementById('stu-reg-username').value.trim();
  const email = document.getElementById('stu-reg-email').value.trim();
  const mobile = document.getElementById('stu-reg-mobile').value.trim();
  const password = document.getElementById('stu-reg-pass').value.trim();
  const confirmPassword = document.getElementById('stu-reg-confirm-pass').value.trim();
  const passwordError = document.getElementById('stu-reg-password-error');
  const otpInput = document.getElementById('stu-reg-otp');

  passwordError.classList.toggle('hidden', password === confirmPassword);
  if (password !== confirmPassword) return;

  try {
    if (pendingStudentOtpEmail !== email) {
      const otp = await apiFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) });
      pendingStudentOtpEmail = email;
      document.getElementById('student-otp-block').classList.remove('hidden');
      document.getElementById('stu-reg-submit-btn').textContent = 'Verify OTP & Create Account';
      if (otp.devCode && otpInput) otpInput.value = otp.devCode;
      return;
    }
    if (!otpInput || !/^\d{6}$/.test(otpInput.value.trim())) {
      alert('Enter the 6-digit OTP sent to your email.');
      return;
    }
    await apiFetch('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp: otpInput.value.trim() }) });
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, username, email, mobile, password, confirmPassword, role: 'student' })
    });
    authToken = data.token;
    localStorage.setItem('sb_token', authToken);
    currentUser = data.user;
    currentProfile = data.profile;
    pendingStudentOtpEmail = null;
    closeModal('student-auth-modal');
    alert(`Account created. Your Student ID is ${data.studentId}. Complete your profile to continue.`);
    switchPortalRole('student');
    showAppWorkspace();
  } catch (err) {
    alert(err.message || 'Student Registration Failed.');
  }
}

// COMPANY AUTH HANDLERS
function openCompanyAuthModal(tab = 'login') {
  openModal('company-auth-modal');
  switchCompanyAuthTab(tab);
}

function switchCompanyAuthTab(tab) {
  const loginForm = document.getElementById('company-login-form');
  const regForm = document.getElementById('company-register-form');
  const title = document.getElementById('comp-auth-title');

  if (tab === 'login') {
    title.innerHTML = '<i class="fa-solid fa-building text-blue"></i> Company Recruiter Login';
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
  } else {
    title.innerHTML = '<i class="fa-solid fa-building text-blue"></i> Register Company Account';
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

async function handleCompanyLoginSubmit(e) {
  e.preventDefault();
  const companyName = document.getElementById('comp-login-name').value.trim();
  const identity = document.getElementById('comp-login-user').value.trim();
  const password = document.getElementById('comp-login-pass').value.trim();

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ companyName, identity, password, role: 'company' })
    });
    authToken = data.token;
    localStorage.setItem('sb_token', authToken);
    currentUser = data.user;
    closeModal('company-auth-modal');
    switchPortalRole('company');
    showAppWorkspace();
  } catch (err) {
    alert(err.message || 'Company Login Failed.');
  }
}

async function handleCompanyRegisterSubmit(e) {
  e.preventDefault();
  const companyName = document.getElementById('comp-reg-name').value.trim();
  const managerName = document.getElementById('comp-reg-mgr').value.trim();
  const email = document.getElementById('comp-reg-email').value.trim();
  const password = document.getElementById('comp-reg-pass').value.trim();

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ companyName, managerName, email, password, role: 'company' })
    });
    authToken = data.token;
    localStorage.setItem('sb_token', authToken);
    currentUser = data.user;
    closeModal('company-auth-modal');
    alert(`Company Account Registered Successfully! Your Company ID is: ${data.company.companyId}`);
    switchPortalRole('company');
    showAppWorkspace();
  } catch (err) {
    alert(err.message || 'Company Registration Failed.');
  }
}

// COLLEGE AUTH HANDLERS
function openCollegeAuthModal(tab = 'login') {
  openModal('college-auth-modal');
  switchCollegeAuthTab(tab);
}

function switchCollegeAuthTab(tab) {
  const loginForm = document.getElementById('college-login-form');
  const regForm = document.getElementById('college-register-form');
  const title = document.getElementById('college-auth-title');

  if (tab === 'login') {
    title.innerHTML = '<i class="fa-solid fa-university text-purple"></i> University Admin Login';
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
  } else {
    title.innerHTML = '<i class="fa-solid fa-university text-purple"></i> Register University Admin';
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

async function handleCollegeLoginSubmit(e) {
  e.preventDefault();
  const identity = document.getElementById('col-login-user').value.trim();
  const password = document.getElementById('col-login-pass').value.trim();

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identity, password, role: 'college' })
    });
    authToken = data.token;
    localStorage.setItem('sb_token', authToken);
    currentUser = data.user;
    closeModal('college-auth-modal');
    switchPortalRole('college');
    showAppWorkspace();
  } catch (err) {
    alert(err.message || 'College Admin Login Failed.');
  }
}

async function handleCollegeRegisterSubmit(e) {
  e.preventDefault();
  const collegeName = document.getElementById('col-reg-name').value.trim();
  const adminName = document.getElementById('col-reg-admin').value.trim();
  const email = document.getElementById('col-reg-email').value.trim();
  const password = document.getElementById('col-reg-pass').value.trim();

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ collegeName, adminName, email, password, role: 'college' })
    });
    authToken = data.token;
    localStorage.setItem('sb_token', authToken);
    currentUser = data.user;
    closeModal('college-auth-modal');
    alert('University Admin Registered Successfully!');
    switchPortalRole('college');
    showAppWorkspace();
  } catch (err) {
    alert(err.message || 'University Registration Failed.');
  }
}

// STUDENT LOADERS
async function loadDashboardHome() {
  try {
    const data = await apiFetch('/student/profile');
    currentProfile = data.profile;
    document.getElementById('welcome-header').textContent = `Welcome back, ${currentProfile.name || 'Student'}`;
    const completion = data.completion || { percentage: 80, missingItems: [] };
    document.getElementById('dash-profile-pct').textContent = `${completion.percentage}%`;
    document.getElementById('dash-profile-bar').style.width = `${completion.percentage}%`;

    const acad = await apiFetch('/student/academics');
    document.getElementById('school-tenth').value = acad.school?.tenth_percentage ?? '';
    document.getElementById('school-twelfth').value = acad.school?.twelfth_percentage ?? '';
    document.getElementById('backlogs-count').value = acad.backlog?.current_backlogs ?? 0;
    document.getElementById('stat-cgpa').textContent = acad.cgpa === null ? 'Not available' : Number(acad.cgpa).toFixed(2);

    const opps = await apiFetch('/opportunities');
    const recContainer = document.getElementById('dash-recommended-jobs');
    recContainer.innerHTML = opps.slice(0, 3).map(j => `
      <div class="saas-card">
        <div class="badge-saas badge-purple mb-2">${j.match_percentage}% MATCH</div>
        <h4 style="font-weight:700;">${j.title}</h4>
        <div style="font-size:0.8rem; color:var(--text-blue); font-weight:700;" class="mb-2">${j.company_name}</div>
        <button class="btn-saas btn-primary w-full" onclick="navigateTo('opportunities')">View & Apply</button>
      </div>
    `).join('');
    const skills = await apiFetch('/student/skills');
    document.getElementById('dash-skills-list').innerHTML = (skills.technical || []).length ? skills.technical.map(skill => `<div>${skill.skillName || skill.skill_name}: ${skill.proficiencyPercentage}% | ${skill.scoreOutOfTen}/10</div>`).join('') : '<span>No skills added yet</span>';
    const portfolio = await apiFetch('/student/portfolio');
    document.getElementById('stat-skills').textContent = skills.technical?.length || 0;
    document.getElementById('stat-projects').textContent = portfolio.projects?.length || 0;
    document.getElementById('stat-certs').textContent = portfolio.certificates?.length || 0;
    document.getElementById('stat-score').textContent = 'Calculated from profile';
    document.getElementById('dash-certificates-count').textContent = `${(portfolio.certificates || []).length} certificate(s)`;
    const match = opps[0];
    document.getElementById('dash-ai-match').textContent = match ? `${match.match_percentage}% match` : 'No job match available';
  } catch (e) {}
}

async function loadProfileView() {
  try {
    const data = await apiFetch('/student/profile');
    const p = data.profile || {};
    document.getElementById('prof-name').value = p.name || '';
    document.getElementById('prof-student-id').value = p.student_id || currentUser.student_id || '';
    document.getElementById('prof-phone').value = p.phone || '';
    document.getElementById('prof-college').value = p.college || '';
    ['university','department','degree','city','state','country','pincode'].forEach(field => { const el = document.getElementById(`prof-${field}`); if (el) el.value = p[field] || ''; });
    ['doorHouse','street','area','district'].forEach(field => { const el = document.getElementById(`prof-${field.replace(/[A-Z]/g, value => `-${value.toLowerCase()}`)}`); if (el) el.value = p.address?.[field] || ''; });
    document.getElementById('prof-dob').value = p.dateOfBirth || '';
    document.getElementById('prof-gender').value = p.gender || '';
    document.getElementById('prof-graduation').value = p.graduationYear || '';
    const acad = await apiFetch('/student/academics');
    const bySemester = Object.fromEntries((acad.records || []).map(record => [record.semester, record.gpa]));
    const fields = document.getElementById('onboarding-gpa-fields');
    fields.innerHTML = Array.from({ length: 8 }, (_, index) => `<div><label class="block text-xs font-bold mb-1">Semester ${index + 1}</label><input type="number" min="0" max="10" step="0.01" class="saas-input onboarding-gpa" data-semester="${index + 1}" value="${bySemester[`Semester ${index + 1}`] ?? ''}" /></div>`).join('');
    fields.querySelectorAll('.onboarding-gpa').forEach(input => input.addEventListener('input', updateOnboardingCGPA));
    updateOnboardingCGPA();
    const pref = await apiFetch('/student/preferences');
    document.getElementById('onboarding-roles').value = (pref.preferences.jobRoles || []).join(', ');
    document.getElementById('onboarding-industries').value = (pref.preferences.industries || []).join(', ');
    document.getElementById('onboarding-locations').value = (pref.preferences.locations || []).join(', ');
    document.getElementById('onboarding-type').value = (pref.preferences.opportunityTypes || [])[0] || '';
    document.getElementById('onboarding-resume').value = p.resume_url || '';
    const skills = await apiFetch('/student/skills');
    document.getElementById('onboarding-skills').value = (skills.technical || []).map(s => `${s.skill_name}:${s.level_pct}`).join(', ');
  } catch (e) {}
}
function updateOnboardingCGPA() {
  const values = [...document.querySelectorAll('.onboarding-gpa')].map(input => input.value).filter(value => value !== '').map(Number).filter(inputValueIsPresent);
  const element = document.getElementById('onboarding-cgpa');
  element.textContent = values.length ? `Current CGPA: ${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)}` : 'Enter semester GPA to calculate CGPA';
}
function inputValueIsPresent(value) { return Number.isFinite(value) && value >= 0; }
async function handleSaveProfile(e) {
  e.preventDefault();
  try {
    const skills = document.getElementById('onboarding-skills').value.split(',').map(item => { const [skillName, proficiencyPercentage] = item.split(':'); return { skillName: (skillName || '').trim(), proficiencyPercentage: Number(proficiencyPercentage), category: 'Other' }; }).filter(skill => skill.skillName && Number.isFinite(skill.proficiencyPercentage));
    const semesterGpa = [...document.querySelectorAll('.onboarding-gpa')].map(input => input.value === '' ? null : Number(input.value));
    const data = await apiFetch('/student/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        profile: { name: document.getElementById('prof-name').value.trim(), phone: document.getElementById('prof-phone').value.trim(), college: document.getElementById('prof-college').value.trim(), university: document.getElementById('prof-university').value.trim(), department: document.getElementById('prof-department').value.trim(), degree: document.getElementById('prof-degree').value.trim(), dateOfBirth: document.getElementById('prof-dob').value, gender: document.getElementById('prof-gender').value, graduationYear: Number(document.getElementById('prof-graduation').value), city: document.getElementById('prof-city').value.trim(), state: document.getElementById('prof-state').value.trim(), country: document.getElementById('prof-country').value.trim(), pincode: document.getElementById('prof-pincode').value.trim(), address: { doorHouse: document.getElementById('prof-door-house').value.trim(), street: document.getElementById('prof-street').value.trim(), area: document.getElementById('prof-area').value.trim(), city: document.getElementById('prof-city').value.trim(), district: document.getElementById('prof-district').value.trim(), state: document.getElementById('prof-state').value.trim(), pincode: document.getElementById('prof-pincode').value.trim() }, resume_url: document.getElementById('onboarding-resume').value.trim() },
        school: { tenth_percentage: Number(document.getElementById('school-tenth').value) || null, twelfth_percentage: Number(document.getElementById('school-twelfth').value) || null },
        backlog: { current_backlogs: Number(document.getElementById('backlogs-count').value) || 0 },
        semesterGpa, skills,
        preferences: { jobRoles: document.getElementById('onboarding-roles').value.split(',').map(value => value.trim()).filter(Boolean), industries: document.getElementById('onboarding-industries').value.split(',').map(value => value.trim()).filter(Boolean), locations: document.getElementById('onboarding-locations').value.split(',').map(value => value.trim()).filter(Boolean), opportunityTypes: [document.getElementById('onboarding-type').value] }
      })
    });
    currentProfile = data.profile;
    alert('Profile saved. Welcome to your dashboard!');
    navigateTo('dashboard');
  } catch (err) { alert(err.message || 'Profile update failed.'); }
}
async function loadAcademicsView() {
  try {
    const data = await apiFetch('/student/academics');
    const tbody = document.getElementById('semester-table-body');
    const records = Object.fromEntries((data.records || []).map(record => [record.semester, record]));
    document.getElementById('academic-tenth').value = data.school?.tenth_percentage ?? '';
    document.getElementById('academic-twelfth').value = data.school?.twelfth_percentage ?? '';
    document.getElementById('academic-backlogs').value = data.backlog?.current_backlogs ?? 0;
    tbody.innerHTML = Array.from({ length: 8 }, (_, index) => { const record = records[`Semester ${index + 1}`]; return `<tr><td style="font-weight:700;">Semester ${index + 1}</td><td><input class="saas-input semester-edit" data-semester="${index + 1}" type="number" min="0" max="10" step="0.01" value="${record?.gpa ?? ''}" oninput="updateAcademicCGPA()"></td><td>${record?.gpa !== null && record?.gpa !== undefined ? 'Completed' : 'Not Completed'}</td></tr>`; }).join('');
    updateAcademicCGPA();
  } catch (e) {}
}
function updateAcademicCGPA() { const values = [...document.querySelectorAll('.semester-edit')].map(input => Number(input.value)).filter(value => Number.isFinite(value) && value >= 0); const target = document.getElementById('academic-cgpa'); if (target) target.textContent = values.length ? `Calculated CGPA: ${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)}` : 'Calculated CGPA: Not available'; }
async function saveAcademicSummary() { try { const semesterGpa = [...document.querySelectorAll('.semester-edit')].map(input => input.value === '' ? null : Number(input.value)); await apiFetch('/student/academics', { method: 'PUT', body: JSON.stringify({ semesterGpa, school: { tenth_percentage: Number(document.getElementById('academic-tenth').value) || null, twelfth_percentage: Number(document.getElementById('academic-twelfth').value) || null }, backlog: { current_backlogs: Number(document.getElementById('academic-backlogs').value) || 0 } }) }); alert('Academic record saved.'); loadAcademicsView(); } catch (err) { alert(err.message); } }
async function loadSkillsView() {
  try {
    const data = await apiFetch('/student/skills');
    document.getElementById('technical-skills-list').innerHTML = (data.technical || []).map(s => `<div class="flex-between"><span>${s.skill_name}</span> <span class="badge-saas badge-purple">${s.level_pct}% · ${s.scoreOutOfTen}/10</span></div>`).join('');
  } catch (e) {}
}
async function handleSkillSubmit(event) { event.preventDefault(); try { const data = await apiFetch('/student/skills', { method: 'POST', body: JSON.stringify({ skillName: document.getElementById('skill-entry-name').value, category: document.getElementById('skill-entry-category').value, proficiencyPercentage: Number(document.getElementById('skill-entry-percent').value) }) }); if (data.duplicate) alert(`${document.getElementById('skill-entry-name').value} already exists in your skills. It was updated.`); else alert('Skill added.'); event.target.reset(); loadSkillsView(); } catch (err) { alert(err.message); } }
async function loadAssessmentsView() {
  try {
    const data = await apiFetch('/student/assessments');
    document.getElementById('assess-overall-score').textContent = `${data.overall_score || 82} / 100`;
    document.getElementById('assessments-list-container').innerHTML = (data.tests || []).map(t => `<div class="saas-card flex-between mb-3"><div><h4 style="font-weight:700;">${t.name}</h4></div><div style="font-weight:800; color:var(--text-emerald);">${t.score}/${t.total}</div></div>`).join('');
  } catch (e) {}
}
async function loadPortfolioView() {
  try {
    const data = await apiFetch('/student/portfolio');
    const projects = (data.projects || []).map(p => `<div class="saas-card mb-3"><h4 style="font-weight:700;">${p.title}</h4><p style="font-size:0.85rem; color:var(--text-muted);">${p.description}</p></div>`).join('');
    const certificates = (data.certificates || []).map(cert => `<div class="saas-card mb-3 flex-between"><div><h4>${cert.certificateName || cert.name}</h4><p class="text-xs">${cert.category || 'Other'} · ${cert.issuer || ''} · ${cert.issueDate || ''}</p></div><div>${cert.certificateUrl ? `<a class="btn-saas btn-outline" href="${cert.certificateUrl}" target="_blank" rel="noreferrer">View</a>` : ''}<button class="btn-saas btn-outline" onclick="deleteCertificate(${cert.id})">Delete</button></div></div>`).join('');
    const achievements = (data.achievements || []).map(item => `<div class="saas-card mb-3"><h4>${item.title || 'Achievement'}</h4><p class="text-xs">${item.organization || ''} · ${item.date || ''}</p></div>`).join('');
    document.getElementById('portfolio-tab-content').innerHTML = `<h2 class="mb-3">Projects</h2>${projects || '<p class="mb-4">No projects recorded.</p>'}<h2 class="mb-3">Certificates</h2>${certificates || '<p class="mb-4">No certificates recorded.</p>'}<h2 class="mb-3">Achievements</h2>${achievements || '<p>No achievements recorded.</p>'}`;
  } catch (e) {}
}
async function loadCertificatesView() {
  try {
    const data = await apiFetch('/student/portfolio');
    const certificates = data.certificates || [];
    document.getElementById('certificates-page-list').innerHTML = certificates.length ? certificates.map(cert => `<div class="saas-card mb-3 flex-between"><div><h4>${cert.certificateName || cert.name}</h4><p class="text-xs">${cert.category || 'Other'} · ${cert.issuer || ''} · ${cert.issueDate || ''}</p></div><div>${cert.certificateUrl ? `<a class="btn-saas btn-outline" href="${cert.certificateUrl}" target="_blank" rel="noreferrer">View</a>` : ''}<button class="btn-saas btn-outline" onclick="deleteCertificate(${cert.id})">Delete</button></div></div>`).join('') : '<div class="saas-card"><p>No certificates added yet</p><button class="btn-saas btn-primary mt-3" onclick="document.getElementById(\'certificate-name\').focus()">+ Add Your First Certificate</button></div>';
  } catch (e) { document.getElementById('certificates-page-list').textContent = 'Unable to load certificates.'; }
}
async function handleCertificateSubmit(event) { event.preventDefault(); try { await apiFetch('/student/certificates', { method: 'POST', body: JSON.stringify({ certificateName: document.getElementById('certificate-name').value.trim(), category: document.getElementById('certificate-category').value, issuer: document.getElementById('certificate-issuer').value.trim(), issueDate: document.getElementById('certificate-date').value, credentialId: document.getElementById('certificate-credential').value.trim(), certificateUrl: document.getElementById('certificate-url').value.trim() }) }); event.target.reset(); alert('Certificate saved.'); loadPortfolioView(); } catch (err) { alert(err.message); } }
async function deleteCertificate(id) { if (!window.confirm('Are you sure you want to delete this certificate?')) return; try { await apiFetch(`/student/certificates/${id}`, { method: 'DELETE' }); if (!document.getElementById('view-certificates').classList.contains('hidden')) loadCertificatesView(); else loadPortfolioView(); } catch (err) { alert(err.message); } }
function openAiAssistant() { document.getElementById('ai-assistant-panel').classList.remove('hidden'); }
function closeAiAssistant() { document.getElementById('ai-assistant-panel').classList.add('hidden'); }
function askAiQuick(message) { document.getElementById('student-ai-chat-input').value = message; document.getElementById('student-ai-chat-input').focus(); }
async function handleAiChatSubmit(event) { event.preventDefault(); const input = document.getElementById('student-ai-chat-input'); const log = document.getElementById('student-ai-chat-log'); const message = input.value.trim(); if (!message) return; log.insertAdjacentHTML('beforeend', `<div class="chat-bubble user">${message}</div>`); input.value = ''; try { const data = await apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }); log.insertAdjacentHTML('beforeend', `<div class="chat-bubble bot">${data.reply}</div>`); log.scrollTop = log.scrollHeight; } catch (err) { log.insertAdjacentHTML('beforeend', `<div class="chat-bubble bot">${err.message}</div>`); } }
async function loadAISkillAnalyzerView() {
  try {
    const data = await apiFetch('/student/jobs/101');
    document.getElementById('ai-match-pct').textContent = `${data.matchPercentage}% Match`;
    document.getElementById('ai-match-details').innerHTML = `<p class="mt-2">${data.recommendationLevel}</p><p class="text-xs mt-2">${data.nonGuarantee}</p><table class="saas-table mt-3"><thead><tr><th>Skill</th><th>Required</th><th>Student</th><th>Result</th></tr></thead><tbody>${(data.skillGaps || []).map(item => `<tr><td>${item.skill}</td><td>${item.reqLevel}</td><td>${item.studentLevel}</td><td>${item.result === 'Match' ? '✓ Match' : '⚠ Gap'}</td></tr>`).join('')}</tbody></table>`;
  } catch (e) {}
}
async function loadSkillMapView() {
  try {
    const data = await apiFetch('/student/skill-map');
    document.getElementById('skill-map-companies').innerHTML = (data.companies || []).map(company => `<span class="badge-saas badge-blue">${company}</span>`).join('') || '<span class="text-sm">No companies available.</span>';
    document.getElementById('skill-map-list').innerHTML = (data.jobs || []).map(job => `<div class="saas-card mb-3"><div class="flex-between"><div><h3>${job.jobTitle}</h3><p class="text-xs" style="color:var(--text-muted);">${job.companyName} · ${job.location || 'Location not specified'} · ${job.jobType || 'Opportunity'}</p></div><div class="text-right"><strong style="color:var(--text-emerald);">${job.matchPercentage}%</strong><div class="text-xs">${job.recommendationLevel}</div></div></div><div class="grid-2 gap-3 mt-3"><div><strong class="text-xs">Strengths</strong><p class="text-xs mt-1">${job.strengths?.join(' ') || 'No matching requirements recorded.'}</p></div><div><strong class="text-xs">Skill gaps</strong><p class="text-xs mt-1">${job.skillGaps?.join(' ') || 'No skill gaps detected.'}</p></div></div><button class="btn-saas btn-outline mt-3" onclick="navigateTo('ai-skill-analyzer'); loadJobAnalysis(${job.jobId})">View AI Analysis</button></div>`).join('') || '<div class="saas-card">No jobs are available for skill mapping.</div>';
  } catch (e) { document.getElementById('skill-map-list').innerHTML = '<div class="saas-card">Unable to load the AI skill map.</div>'; }
}
async function loadJobAnalysis(jobId) { try { const data = await apiFetch(`/student/jobs/${jobId}`); document.getElementById('ai-match-pct').textContent = `${data.matchPercentage}% Match`; document.getElementById('ai-match-details').innerHTML = `<p class="mt-2">${data.recommendationLevel}</p><p class="text-xs mt-2">${data.nonGuarantee}</p><table class="saas-table mt-3"><thead><tr><th>Skill</th><th>Required</th><th>Student</th><th>Result</th></tr></thead><tbody>${(data.skillGaps || []).map(item => `<tr><td>${item.skill}</td><td>${item.reqLevel}</td><td>${item.studentLevel}</td><td>${item.result === 'Match' ? '✓ Match' : '⚠ Gap'}</td></tr>`).join('')}</tbody></table>`; } catch (e) {} }
async function loadOpportunitiesView() {
  try {
    const jobs = await apiFetch('/opportunities');
    document.getElementById('opportunities-list-container').innerHTML = jobs.map(j => `<div class="saas-card mb-3"><h4 style="font-weight:700;">${j.title}</h4><div style="color:var(--text-blue); font-weight:700;" class="mb-2">${j.company_name}</div><button class="btn-saas btn-primary" onclick="handleApplyJob(${j.id})">Apply Position</button></div>`).join('');
  } catch (e) {}
}
async function handleApplyJob(jobId) {
  try {
    await apiFetch('/student/apply', { method: 'POST', body: JSON.stringify({ jobId }) });
    alert('Application submitted!');
    navigateTo('applications');
  } catch (err) { alert(err.message); }
}
async function loadApplicationsView() {
  try {
    const apps = await apiFetch('/student/applications');
    document.getElementById('applications-list-container').innerHTML = apps.map(a => `<div class="saas-card mb-3 flex-between application-row"><div><h4 style="font-weight:700;">${a.job_title}</h4><div style="font-size:0.85rem; color:var(--text-blue);">${a.company_name}</div><div class="text-xs mt-2" style="color:var(--text-muted);">${a.interview ? `Interview: ${a.interview.date} at ${a.interview.time}` : 'Application in progress'}</div></div><div class="flex-align gap-2"><span class="badge-saas badge-emerald">${a.status}</span>${a.interview ? '<button class="btn-saas btn-primary" onclick="navigateTo(\'interview-prep\')"><i class="fa-solid fa-microphone-lines"></i> Practice</button>' : ''}</div></div>`).join('') || '<div class="saas-card">No applications yet.</div>';
  } catch (e) {}
}

function loadInterviewPrepView() {
  setInterviewLanguage(document.getElementById('interview-language')?.value || voiceInterview.language);
  if (!voiceInterview.sessionStarted && !voiceInterview.answers.length && voiceInterview.questionIndex === 0) resetInterviewView();
}

function setInterviewLanguage(language) {
  voiceInterview.language = language;
  const languageSelect = document.getElementById('interview-language');
  if (languageSelect && languageSelect.value !== language) {
    languageSelect.value = language;
  }

  if (voiceInterview.questionIndex < interviewQuestions.length && document.getElementById('interview-question')) {
    const question = interviewQuestions[voiceInterview.questionIndex];
    const text = language === 'ta-IN' ? question.ta : question.en;
    const questionEl = document.getElementById('interview-question');
    const currentText = questionEl.textContent || '';
    if (!voiceInterview.sessionStarted && (currentText.includes('Choose a language') || currentText.includes('Ready when you are'))) {
      questionEl.textContent = text;
    }
  }
}

function resetInterviewView() {
  voiceInterview.questionIndex = 0;
  voiceInterview.answers = [];
  voiceInterview.lastTranscript = '';
  voiceInterview.sessionStarted = false;
  voiceInterview.listening = false;
  if (voiceInterview.recognition) {
    try { voiceInterview.recognition.stop(); } catch (err) {}
    voiceInterview.recognition = null;
  }

  const questionNumber = document.getElementById('interview-question-number');
  const startButton = document.getElementById('interview-start-btn');
  const listenButton = document.getElementById('interview-listen-btn');
  const nextButton = document.getElementById('interview-next-btn');
  if (questionNumber) questionNumber.textContent = 'Ready when you are';
  if (startButton) startButton.disabled = false;
  if (listenButton) listenButton.disabled = true;
  if (nextButton) nextButton.disabled = true;
  document.getElementById('interview-progress').textContent = '0 / 5';
  document.getElementById('interview-question').textContent = 'Choose a language and start the mock interview. The agent will ask one question at a time.';
  document.getElementById('interview-transcript').value = '';
  document.getElementById('interview-summary').innerHTML = '<span class="text-sm" style="color:var(--text-muted);">Your practice summary will appear here when you finish.</span>';
  setInterviewStatus('Microphone is off');
}

function setInterviewStatus(message) {
  const status = document.getElementById('interview-status');
  if (status) status.textContent = message;
}

function getPreferredVoice(languageCode) {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const normalized = languageCode.toLowerCase();
  return voices.find(voice => {
    const name = (voice.lang || '').toLowerCase();
    return name === normalized || name.startsWith(normalized.replace('-', '')) || name.startsWith(normalized.substring(0, 2));
  }) || voices.find(voice => (voice.lang || '').toLowerCase().startsWith(languageCode.slice(0, 2))) || voices[0];
}

function speakInterviewQuestion(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voiceInterview.language;
  const preferredVoice = getPreferredVoice(voiceInterview.language);
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.rate = 0.92;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function updateInterviewAnswerState() {
  const transcript = document.getElementById('interview-transcript').value.trim();
  const nextButton = document.getElementById('interview-next-btn');
  nextButton.disabled = !transcript;
  setInterviewStatus(transcript ? 'Answer ready. Review it and continue.' : 'Ready for your answer');
}

function startVoiceInterview() {
  resetInterviewView();
  voiceInterview.sessionStarted = true;
  const question = interviewQuestions[0];
  const text = voiceInterview.language === 'ta-IN' ? question.ta : question.en;
  document.getElementById('interview-question-number').textContent = 'Question 1';
  document.getElementById('interview-progress').textContent = '1 / 5';
  document.getElementById('interview-question').textContent = text;
  document.getElementById('interview-start-btn').disabled = true;
  document.getElementById('interview-listen-btn').disabled = !getSpeechRecognition();
  document.getElementById('interview-next-btn').disabled = true;
  setInterviewStatus(getSpeechRecognition() ? 'Ready for your answer' : 'Voice input is unavailable; type your answer below');
  speakInterviewQuestion(text);
}

function toggleVoiceInput() {
  const Recognition = getSpeechRecognition();
  if (!Recognition) {
    setInterviewStatus('This browser does not support microphone input.');
    return;
  }

  if (voiceInterview.listening) {
    voiceInterview.recognition.stop();
    return;
  }

  const recognition = new Recognition();
  recognition.lang = voiceInterview.language;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 3;

  voiceInterview.recognition = recognition;
  voiceInterview.listening = true;

  recognition.onstart = () => setInterviewStatus('Listening... Speak clearly into the mic.');
  recognition.onresult = event => {
    // Build a transcript that prefers final results but also shows interim text.
    let interim = '';
    let finalTranscript = '';
    for (let i = 0; i < event.results.length; i++) {
      const res = event.results[i];
      const piece = (res[0] && res[0].transcript) ? res[0].transcript : '';
      if (res.isFinal) finalTranscript += piece + ' ';
      else interim += piece + ' ';
    }
    const combined = (finalTranscript + interim).trim();
    if (!combined) return;
    document.getElementById('interview-transcript').value = combined;
    voiceInterview.lastTranscript = combined;
    updateInterviewAnswerState();
    // If we received a final result, offer the user to continue immediately.
    if (finalTranscript.trim()) {
      document.getElementById('interview-next-btn').disabled = false;
      setInterviewStatus('Answer captured. Review and continue.');
    }
  };
  recognition.onerror = event => {
    const errorMessage = event.error === 'not-allowed'
      ? 'Microphone permission was denied. You can still type your answer.'
      : `Voice input error: ${event.error}`;
    setInterviewStatus(errorMessage);
    voiceInterview.listening = false;
    // Ensure recognition reference is cleared so future toggles recreate it.
    try { voiceInterview.recognition && voiceInterview.recognition.abort(); } catch (e) {}
    voiceInterview.recognition = null;
  };
  recognition.onend = () => {
    voiceInterview.listening = false;
    const typedValue = document.getElementById('interview-transcript').value.trim();
    const last = (voiceInterview.lastTranscript || '').trim();
    if (typedValue || last) {
      if (!typedValue && last) document.getElementById('interview-transcript').value = last;
      setInterviewStatus('Answer ready. Review it and continue.');
      document.getElementById('interview-next-btn').disabled = false;
    } else {
      setInterviewStatus('No answer captured. Type your response or try again.');
    }
    // Clear recognition so subsequent toggles create a fresh instance.
    voiceInterview.recognition = null;
  };

  recognition.start();
}

function submitInterviewAnswer() {
  const transcript = document.getElementById('interview-transcript').value.trim();
  if (!transcript) {
    setInterviewStatus('Speak or type an answer before continuing.');
    return;
  }

  voiceInterview.answers.push(transcript);
  const isLastQuestion = voiceInterview.questionIndex >= interviewQuestions.length - 1;
  if (isLastQuestion) {
    finishVoiceInterview();
    return;
  }

  voiceInterview.questionIndex += 1;
  const question = interviewQuestions[voiceInterview.questionIndex];
  const text = voiceInterview.language === 'ta-IN' ? question.ta : question.en;
  document.getElementById('interview-question-number').textContent = `Question ${voiceInterview.questionIndex + 1}`;
  document.getElementById('interview-progress').textContent = `${voiceInterview.questionIndex + 1} / 5`;
  document.getElementById('interview-question').textContent = text;
  document.getElementById('interview-transcript').value = '';
  document.getElementById('interview-next-btn').disabled = true;
  setInterviewStatus('Ready for your answer');
  speakInterviewQuestion(text);
}

function finishVoiceInterview() {
  if (voiceInterview.recognition && voiceInterview.listening) voiceInterview.recognition.stop();
  const answered = voiceInterview.answers.length;
  const summaryItems = voiceInterview.answers.map((answer, index) => `<div class="text-sm mb-2"><strong>Q${index + 1}:</strong> ${answer.slice(0, 220)}${answer.length > 220 ? '…' : ''}</div>`).join('');

  document.getElementById('interview-question-number').textContent = 'Practice complete';
  document.getElementById('interview-progress').textContent = `${answered} / 5 answered`;
  document.getElementById('interview-question').textContent = 'Good work. Review your answers and repeat the round to improve clarity and structure.';
  document.getElementById('interview-start-btn').disabled = false;
  document.getElementById('interview-next-btn').disabled = true;
  document.getElementById('interview-listen-btn').disabled = true;
  document.getElementById('interview-summary').innerHTML = `<strong>${answered}/5 responses captured</strong><div class="mt-3">${summaryItems || '<p class="text-sm mt-2">No answers recorded yet.</p>'}</div><p class="text-sm mt-2">Try answering with a clear situation, action, and result. No audio or transcript was uploaded.</p>`;
  setInterviewStatus('Session complete');
  if ('speechSynthesis' in window) speakInterviewQuestion(voiceInterview.language === 'ta-IN' ? 'நன்றி. உங்கள் நேர்காணல் பயிற்சி முடிந்தது.' : 'Thank you. Your interview practice is complete.');
}
async function loadNotificationsView() {
  try {
    const list = await apiFetch('/student/notifications');
    document.getElementById('notifications-list-container').innerHTML = list.map(n => `<div class="saas-card mb-3"><h4 style="font-weight:700;">${n.title}</h4><p style="font-size:0.85rem; color:var(--text-muted);">${n.message}</p></div>`).join('');
  } catch (e) {}
}
async function loadCampusDrivesView() {
  try {
    const drives = await apiFetch('/student/campus-drives');
    document.getElementById('campus-drives-list').innerHTML = drives.length ? drives.map(drive => `<div class="saas-card mb-3"><div class="flex-between"><div><h3>${drive.company}</h3><p>${drive.role} · ${drive.location}</p></div><span class="badge-saas ${drive.eligible ? 'badge-emerald' : 'badge-red'}">${drive.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</span></div><p class="text-xs mt-2">Drive: ${drive.date} · Deadline: ${drive.deadline} · ${drive.salary}</p><p class="text-xs mt-2" style="color:var(--text-muted);">${drive.reason}</p>${drive.eligible && !drive.registered ? `<button class="btn-saas btn-primary mt-3" onclick="registerForDrive(${drive.id})">Register</button>` : drive.registered ? '<span class="badge-saas badge-emerald mt-3">Registered</span>' : ''}</div>`).join('') : '<div class="saas-card">No campus drives are available.</div>';
  } catch (e) { document.getElementById('campus-drives-list').innerHTML = '<div class="saas-card">Unable to load campus drives.</div>'; }
}
async function registerForDrive(driveId) {
  try { await apiFetch(`/student/campus-drives/${driveId}/register`, { method: 'POST' }); alert('Registered for the campus drive.'); loadCampusDrivesView(); } catch (err) { alert(err.message); }
}
async function loadPlacementView() {
  try {
    const data = await apiFetch('/student/placement');
    const placement = data.placement;
    document.getElementById('placement-current').innerHTML = placement ? `<div class="badge-saas badge-emerald">${placement.status || 'Placed'}</div><h3 class="mt-2">${placement.companyName} · ${placement.role}</h3><p>${placement.package || ''} ${placement.location || ''}</p>` : '<p style="color:var(--text-muted);">No placement recorded yet.</p>';
    if (placement) ['company','role','department','package','location'].forEach(field => { const element = document.getElementById(`placement-${field}`); if (element) element.value = placement[field === 'company' ? 'companyName' : field] || ''; });
  } catch (e) {}
}
async function handleSavePlacement(e) {
  e.preventDefault();
  try { await apiFetch('/student/placement', { method: 'POST', body: JSON.stringify({ companyName: document.getElementById('placement-company').value.trim(), role: document.getElementById('placement-role').value.trim(), department: document.getElementById('placement-department').value.trim(), package: document.getElementById('placement-package').value.trim(), placementDate: document.getElementById('placement-date').value, joiningDate: document.getElementById('placement-joining').value, location: document.getElementById('placement-location').value.trim(), placementType: document.getElementById('placement-type').value, status: 'Placed' }) }); alert('Placement saved.'); loadPlacementView(); } catch (err) { alert(err.message); }
}

async function loadSettingsView() {
  try {
    const data = await apiFetch('/student/settings');
    document.getElementById('setting-username').value = data.user.username || '';
    document.getElementById('setting-email').value = data.user.email || '';
    document.getElementById('setting-mobile').value = data.user.mobile || '';
    document.getElementById('setting-student-id').value = data.user.studentId || '';
    const fields = [['jobNotifications', 'Job Match'], ['internshipNotifications', 'Internship'], ['campusDriveNotifications', 'Campus Drive'], ['applicationNotifications', 'Application Updates'], ['interviewNotifications', 'Interview Updates'], ['placementNotifications', 'Placement Updates'], ['recruiterDiscovery', 'Allow Companies to Discover My Profile'], ['showSkills', 'Show Skills to Recruiters'], ['showAcademicInfo', 'Show Academic Info to Recruiters'], ['showContactInfo', 'Show Contact Info to Recruiters']];
    document.getElementById('settings-toggles').innerHTML = fields.map(([key, label]) => `<label class="flex-align gap-2"><input type="checkbox" data-setting="${key}" ${data.settings[key] ? 'checked' : ''}>${label}</label>`).join('');
    document.getElementById('setting-theme').value = data.settings.theme || 'system';
    applyTheme(data.settings.theme || 'system');
  } catch (e) {}
}
async function saveSettings(event) { event.preventDefault(); try { const settings = { theme: document.getElementById('setting-theme').value }; document.querySelectorAll('[data-setting]').forEach(input => { settings[input.dataset.setting] = input.checked; }); await apiFetch('/student/settings', { method: 'PUT', body: JSON.stringify(settings) }); await apiFetch('/student/account', { method: 'PUT', body: JSON.stringify({ username: document.getElementById('setting-username').value.trim(), email: document.getElementById('setting-email').value.trim(), mobile: document.getElementById('setting-mobile').value.trim() }) }); applyTheme(settings.theme); alert('Settings saved.'); } catch (err) { alert(err.message); } }
async function changePassword(event) { event.preventDefault(); try { const data = await apiFetch('/student/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword: document.getElementById('current-password').value, newPassword: document.getElementById('new-password').value, confirmPassword: document.getElementById('confirm-password').value }) }); alert(data.message); event.target.reset(); } catch (err) { alert(err.message); } }
async function deleteStudentAccount() { if (!window.confirm('Delete your account and all associated profile data? This action cannot be undone.')) return; try { await apiFetch('/student/account', { method: 'DELETE' }); alert('Your account and associated data were deleted.'); handleLogout(); } catch (err) { alert(err.message); } }
function applyTheme(theme) { const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme; document.body.dataset.theme = resolved; localStorage.setItem('sb_theme', theme); }

// COMPANY RECRUITER LOADERS
async function loadCompanyATSPipeline() {
  try {
    const data = await apiFetch('/company/dashboard');
    const comp = data.company || {};
    document.getElementById('comp-header').textContent = `${comp.name || 'TechCorp'} ATS Pipeline`;
    document.getElementById('comp-id-badge').textContent = comp.companyId || 'CMP-10001';
    document.getElementById('comp-total-jobs').textContent = data.total_jobs || 0;
    document.getElementById('comp-total-apps').textContent = data.total_applicants || 0;
    document.getElementById('comp-shortlisted').textContent = data.shortlisted || 0;

    const stages = ['Eligible', 'Applied', 'AI Screening', 'Shortlisted', 'Technical Interview', 'HR Interview', 'Selected', 'Rejected'];
    const board = document.getElementById('ats-kanban-board');
    const apps = data.pipeline || [];

    board.innerHTML = stages.map(st => {
      const filtered = apps.filter(a => a.status === st);
      return `
        <div class="pipeline-stage-col">
          <div class="pipeline-stage-header"><span>${st}</span><span class="badge-saas badge-blue">${filtered.length}</span></div>
          ${filtered.map(cand => `
            <div class="candidate-kanban-card">
              <div style="font-weight:700;">${cand.candidate_name || 'Student'}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);" class="mb-2">CGPA: ${cand.cgpa ?? 'Hidden'} • ${cand.job_title || 'Job'}</div>
              <select class="saas-input" style="font-size:0.75rem; padding:0.25rem 0.5rem;" onchange="handleMoveCandidateStage(${cand.id}, this.value)">
                ${stages.map(s => `<option value="${s}" ${s === st ? 'selected' : ''}>Move to: ${s}</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
  } catch (e) {}
}

async function handleMoveCandidateStage(appId, newStage) {
  try {
    await apiFetch('/company/pipeline/stage', { method: 'PUT', body: JSON.stringify({ applicationId: appId, newStage }) });
    loadCompanyATSPipeline();
  } catch (err) { alert(err.message); }
}

async function handlePostJobSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('job-post-title').value.trim();
  const location = document.getElementById('job-post-loc').value.trim();
  const salary_stipend = document.getElementById('job-post-salary').value.trim();
  const min_cgpa = document.getElementById('job-post-cgpa').value;
  const required_skills = document.getElementById('job-post-skills').value.trim();
  const deadline = document.getElementById('job-post-deadline').value;

  try {
    await apiFetch('/company/jobs', {
      method: 'POST',
      body: JSON.stringify({ title, location, salary_stipend, min_cgpa, required_skills, deadline })
    });
    alert('Job Requirement Published to Candidates!');
    navigateTo('company-dashboard');
  } catch (err) { alert(err.message); }
}

async function loadTalentFinder() {
  try {
    const data = await apiFetch('/company/dashboard');
    const selector = document.getElementById('company-job-selector');
    const jobs = data.jobs || [];
    selector.innerHTML = jobs.length ? jobs.map(job => `<option value="${job.id}">${job.title}</option>`).join('') : '<option value="">No jobs posted</option>';
    await loadCompanyJobCandidates();
  } catch (e) {}
}
async function loadCompanyJobCandidates() { const jobId = document.getElementById('company-job-selector')?.value; if (!jobId) { document.getElementById('talent-candidates-list').innerHTML = '<p>No jobs posted yet.</p>'; return; } try { const data = await apiFetch(`/company/jobs/${jobId}/candidates`); document.getElementById('talent-candidates-list').innerHTML = data.candidates.length ? data.candidates.map(candidate => `<div class="saas-card"><h4>${candidate.name}</h4><div class="text-xs">${candidate.studentId} · CGPA: ${candidate.cgpa ?? 'Hidden'}</div><strong style="color:var(--text-emerald);">${candidate.matchPercentage}% · ${candidate.recommendationLevel}</strong><p class="text-xs mt-2">${candidate.skills.map(skill => `${skill.name} ${skill.scoreOutOfTen}/10`).join(', ') || 'Skills hidden by privacy settings'}</p><p class="text-xs mt-2">${candidate.skillGaps.filter(item => item.result === 'Gap').map(item => `Gap: ${item.skill}`).join(', ') || 'All listed requirements matched'}</p></div>`).join('') : '<p>No privacy-eligible candidates available.</p>'; } catch (err) { document.getElementById('talent-candidates-list').textContent = err.message; } }
async function askCompanyAssistant(event) { event.preventDefault(); try { const data = await apiFetch('/company/assistant', { method: 'POST', body: JSON.stringify({ message: document.getElementById('company-assistant-input').value }) }); document.getElementById('company-assistant-reply').textContent = data.reply; } catch (err) { document.getElementById('company-assistant-reply').textContent = err.message; } }
async function askCompanyAssistantFromDashboard(event) { event.preventDefault(); try { const data = await apiFetch('/company/assistant', { method: 'POST', body: JSON.stringify({ message: document.getElementById('company-dashboard-assistant-input').value }) }); document.getElementById('company-dashboard-assistant-reply').textContent = data.reply; } catch (err) { document.getElementById('company-dashboard-assistant-reply').textContent = err.message; } }

// COLLEGE ADMIN LOADERS
async function loadCollegeDashboard() {
  try {
    const data = await apiFetch('/college/dashboard');
    document.getElementById('col-total-students').textContent = data.total_students;
    document.getElementById('col-placed-students').textContent = data.placed_students;
    document.getElementById('col-placement-rate').textContent = `${data.placement_rate}%`;

    const tbody = document.getElementById('college-dept-table');
    tbody.innerHTML = (data.department_stats || []).map(d => `<tr><td style="font-weight:700;">${d.name}</td><td>${d.total}</td><td style="color:var(--text-emerald); font-weight:800;">${d.placed}</td><td><span class="badge-saas badge-emerald">${d.percentage}%</span></td></tr>`).join('');
  } catch (e) {}
}
async function askCollegeAssistant(event) { event.preventDefault(); try { const data = await apiFetch('/college/assistant', { method: 'POST', body: JSON.stringify({ message: document.getElementById('college-assistant-input').value }) }); document.getElementById('college-assistant-reply').textContent = data.reply; } catch (err) { document.getElementById('college-assistant-reply').textContent = err.message; } }

async function loadCollegeStudentDirectory() {
  try {
    const students = await apiFetch('/college/students');
    document.getElementById('college-students-list').innerHTML = students.map(s => `<div class="saas-card"><h4 style="font-weight:700;">${s.name}</h4><div style="font-size:0.8rem; color:var(--text-muted);">${s.student_id} • ${s.department}</div></div>`).join('');
  } catch (e) {}
}

// UTILS
function openModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }
function openLogoutModal() { handleLogout(); }
function handleLogout() { authToken = null; currentUser = null; currentProfile = null; localStorage.removeItem('sb_token'); showGuestLanding(); }
function closeMobileDrawer() { const sidebar = document.getElementById('app-sidebar'); if (sidebar) sidebar.classList.remove('mobile-open'); }
function toggleMobileDrawer() { const sidebar = document.getElementById('app-sidebar'); if (sidebar) sidebar.classList.toggle('mobile-open'); }
