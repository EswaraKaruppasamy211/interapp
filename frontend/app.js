// SkillBridge — Enforced Security Client Engine for Student, Company & College Modules

const API_BASE = 'https://interview-wc6b.onrender.com/api';

let currentUser = null;
let currentProfile = null;
let currentRole = 'student';
let authToken = localStorage.getItem('sb_token') || null;

document.addEventListener('DOMContentLoaded', async () => {
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
  else if (viewId === 'assessments') loadAssessmentsView();
  else if (viewId === 'portfolio') loadPortfolioView();
  else if (viewId === 'ai-skill-analyzer') loadAISkillAnalyzerView();
  else if (viewId === 'opportunities') loadOpportunitiesView();
  else if (viewId === 'applications') loadApplicationsView();
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

  passwordError.classList.toggle('hidden', password === confirmPassword);
  if (password !== confirmPassword) return;

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, username, email, mobile, password, confirmPassword, role: 'student' })
    });
    authToken = data.token;
    localStorage.setItem('sb_token', authToken);
    currentUser = data.user;
    currentProfile = data.profile;
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
async function handleCertificateSubmit(event) { event.preventDefault(); try { await apiFetch('/student/certificates', { method: 'POST', body: JSON.stringify({ certificateName: document.getElementById('certificate-name').value.trim(), category: document.getElementById('certificate-category').value, issuer: document.getElementById('certificate-issuer').value.trim(), issueDate: document.getElementById('certificate-date').value, credentialId: document.getElementById('certificate-credential').value.trim(), certificateUrl: document.getElementById('certificate-url').value.trim() }) }); event.target.reset(); alert('Certificate saved.'); loadPortfolioView(); } catch (err) { alert(err.message); } }
async function deleteCertificate(id) { if (!window.confirm('Are you sure you want to delete this certificate?')) return; try { await apiFetch(`/student/certificates/${id}`, { method: 'DELETE' }); loadPortfolioView(); } catch (err) { alert(err.message); } }
async function loadAISkillAnalyzerView() {
  try {
    const data = await apiFetch('/student/jobs/101');
    document.getElementById('ai-match-pct').textContent = `${data.matchPercentage}% Match`;
    document.getElementById('ai-match-pct').insertAdjacentHTML('afterend', `<p class="mt-2">${data.recommendationLevel}</p><p class="text-xs mt-2">${data.nonGuarantee}</p><table class="saas-table mt-3"><thead><tr><th>Skill</th><th>Required</th><th>Student</th><th>Result</th></tr></thead><tbody>${(data.skillGaps || []).map(item => `<tr><td>${item.skill}</td><td>${item.reqLevel}</td><td>${item.studentLevel}</td><td>${item.result === 'Match' ? '✓ Match' : '⚠ Gap'}</td></tr>`).join('')}</tbody></table>`);
  } catch (e) {}
}
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
    document.getElementById('applications-list-container').innerHTML = apps.map(a => `<div class="saas-card mb-3 flex-between"><div><h4 style="font-weight:700;">${a.job_title}</h4><div style="font-size:0.85rem; color:var(--text-blue);">${a.company_name}</div></div><span class="badge-saas badge-emerald">${a.status}</span></div>`).join('');
  } catch (e) {}
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
function applyTheme(theme) { const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme; document.body.dataset.theme = resolved; localStorage.setItem('sb_theme', theme); }

// COMPANY RECRUITER LOADERS
async function loadCompanyATSPipeline() {
  try {
    const data = await apiFetch('/company/dashboard');
    const comp = data.company || {};
    document.getElementById('comp-header').textContent = `${comp.name || 'TechCorp'} ATS Pipeline`;
    document.getElementById('comp-id-badge').textContent = comp.companyId || 'CMP-10001';
    document.getElementById('comp-total-jobs').textContent = data.total_jobs || 2;
    document.getElementById('comp-total-apps').textContent = data.total_applicants || 1;
    document.getElementById('comp-shortlisted').textContent = data.shortlisted || 1;

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
              <div style="font-weight:700;">${cand.candidate_name || 'Arjun Sharma'}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);" class="mb-2">CGPA: ${cand.cgpa || 8.8} • ${cand.job_title}</div>
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
    const students = await apiFetch('/company/talent-finder');
    document.getElementById('talent-candidates-list').innerHTML = students.map(s => `<div class="saas-card"><h4 style="font-weight:700;">${s.name}</h4><div style="font-size:0.8rem; color:var(--text-muted);">${s.studentId} • ${s.department}</div><div style="font-size:0.85rem; font-weight:800; color:var(--text-emerald);" class="mt-2">${s.matchPercentage}% · ${s.recommendationLevel}</div><div class="text-xs mt-2">${s.skills.map(skill => `${skill.name} ${skill.scoreOutOfTen}/10`).join(', ') || 'Skills hidden by privacy settings'}</div></div>`).join('');
  } catch (e) {}
}
async function askCompanyAssistant(event) { event.preventDefault(); try { const data = await apiFetch('/company/assistant', { method: 'POST', body: JSON.stringify({ message: document.getElementById('company-assistant-input').value }) }); document.getElementById('company-assistant-reply').textContent = data.reply; } catch (err) { document.getElementById('company-assistant-reply').textContent = err.message; } }

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
