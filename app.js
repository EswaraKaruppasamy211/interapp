// SkillBridge — Enforced Security Client Engine for Student, Company & College Modules

const API_BASE = '/api';

let currentUser = null;
let currentProfile = null;
let currentRole = 'student';
let authToken = localStorage.getItem('sb_token') || null;
let pendingStudentOtpEmail = null;
let otpCountdownTimer = null;
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
  {
    en: 'Tell me about yourself and the kind of software role you are looking for.',
    ta: 'உங்களைப் பற்றியும், நீங்கள் தேடும் மென்பொருள் வேலையின் வகையைப் பற்றியும் சொல்லுங்கள்.'
  },
  {
    en: 'Explain one project you built and the most important technical decision you made.',
    ta: 'நீங்கள் உருவாக்கிய ஒரு திட்டத்தையும், அதில் எடுத்த முக்கியமான தொழில்நுட்ப முடிவையும் விளக்குங்கள்.'
  },
  {
    en: 'How would you debug an API that suddenly became slow in production?',
    ta: 'Production-ல் திடீரென மெதுவான API-ஐ எப்படி டெபக் செய்வீர்கள்?'
  },
  {
    en: 'Describe a time you solved a difficult problem with a teammate.',
    ta: 'ஒரு சக ஊழியருடன் சேர்ந்து கடினமான பிரச்சினையைத் தீர்த்த அனுபவத்தை சொல்லுங்கள்.'
  },
  {
    en: 'Why should we select you for this role?',
    ta: 'இந்த பணிக்கு உங்களை ஏன் தேர்வு செய்ய வேண்டும்?'
  },
  {
    en: 'What is the difference between HTTP and HTTPS?',
    ta: 'HTTP மற்றும் HTTPS-க்கு இடையிலான வித்தியாசம் என்ன?'
  },
  {
    en: 'How do you improve application performance under heavy load?',
    ta: 'அதிக லோட் இருக்கும் போது செயல்திறனை எப்படி மேம்படுத்துவது?'
  },
  {
    en: 'Describe how you would ensure data security in a web application.',
    ta: 'Web application-ல் data security-ஐ எவ்வாறு உறுதி செய்வீர்கள்?'
  },
  {
    en: 'How do you handle conflict in a team environment?',
    ta: 'குழு சூழலில் மோதலை எப்படி கையாள்வீர்கள்?'
  },
  {
    en: 'Where do you see yourself in 2 years and what are your goals?',
    ta: '2 வருடங்களில் நீங்களே எங்கு இருப்பீர்கள், உங்கள் இலக்குகள் என்ன?'
  }
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read uploaded file.'));
    reader.readAsDataURL(file);
  });
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
  else if (viewId === 'interview-prep') loadInterviewPrepView();
  else if (viewId === 'notifications') loadNotificationsView();
  else if (viewId === 'placement') loadPlacementView();
  else if (viewId === 'campus-drives') loadCampusDrivesView();
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
  const otpBlock = document.getElementById('student-otp-block');
  const submitButton = document.getElementById('stu-reg-submit-btn');

  if (tab === 'login') {
    title.innerHTML = '<i class="fa-solid fa-graduation-cap text-blue"></i> Student Sign In';
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    pendingStudentOtpEmail = null;
    if (otpBlock) otpBlock.classList.add('hidden');
    if (submitButton) submitButton.textContent = 'Send OTP';
    if (otpCountdownTimer) clearInterval(otpCountdownTimer);
  } else {
    title.innerHTML = '<i class="fa-solid fa-user-plus text-blue"></i> Register Student Account';
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    pendingStudentOtpEmail = null;
    if (otpBlock) otpBlock.classList.add('hidden');
    if (submitButton) submitButton.textContent = 'Send OTP';
    if (otpCountdownTimer) clearInterval(otpCountdownTimer);
  }
}

function setStudentOtpCountdown(seconds) {
  const timer = document.getElementById('stu-reg-otp-timer');
  const resendBtn = document.getElementById('stu-reg-resend-btn');
  if (!timer || !resendBtn) return;

  let remaining = seconds;
  resendBtn.disabled = true;
  const tick = () => {
    remaining -= 1;
    timer.textContent = remaining > 0 ? `${remaining}s` : 'Ready';
    if (remaining <= 0) {
      resendBtn.disabled = false;
      timer.textContent = 'Ready';
      clearInterval(otpCountdownTimer);
      otpCountdownTimer = null;
    }
  };
  tick();
  if (otpCountdownTimer) clearInterval(otpCountdownTimer);
  otpCountdownTimer = setInterval(tick, 1000);
}

async function requestStudentOtp(email, password, confirmPassword) {
  const otpBlock = document.getElementById('student-otp-block');
  const submitButton = document.getElementById('stu-reg-submit-btn');
  const otpInput = document.getElementById('stu-reg-otp');

  const data = await apiFetch('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  pendingStudentOtpEmail = email;
  if (otpBlock) otpBlock.classList.remove('hidden');
  if (submitButton) submitButton.textContent = 'Verify OTP & Create Account';
  setStudentOtpCountdown(30);

  if (data.devCode && otpInput) {
    otpInput.value = data.devCode;
  }

  return { success: true, password, confirmPassword };
}

async function resendStudentOtp() {
  const email = document.getElementById('stu-reg-email').value.trim();
  const password = document.getElementById('stu-reg-pass').value.trim();
  const confirmPassword = document.getElementById('stu-reg-confirm-pass').value.trim();
  if (!email) {
    alert('Enter your email address first.');
    return;
  }
  try {
    await requestStudentOtp(email, password, confirmPassword);
  } catch (err) {
    alert(err.message || 'Unable to resend student OTP.');
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
  const otpCode = document.getElementById('stu-reg-otp')?.value.trim() || '';
  const passwordError = document.getElementById('stu-reg-password-error');
  passwordError.classList.toggle('hidden', password === confirmPassword);
  if (password !== confirmPassword) return;

  try {
    if (!pendingStudentOtpEmail || pendingStudentOtpEmail !== email) {
      await requestStudentOtp(email, password, confirmPassword);
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      alert('Enter the 6-digit OTP sent to your email before creating the account.');
      return;
    }

    await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp: otpCode })
    });

    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, username, email, mobile, password, confirmPassword, role: 'student' })
    });

    pendingStudentOtpEmail = null;
    if (otpCountdownTimer) clearInterval(otpCountdownTimer);
    document.getElementById('student-otp-block').classList.add('hidden');
    document.getElementById('stu-reg-submit-btn').textContent = 'Send OTP';

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
    const questionEl = document.getElementById('interview-question');
    const currentText = questionEl.textContent || '';
    if (!voiceInterview.sessionStarted && (currentText.includes('Choose a language') || currentText.includes('Ready when you are'))) {
      questionEl.textContent = language === 'ta-IN' ? question.ta : question.en;
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
  if (document.getElementById('interview-progress')) document.getElementById('interview-progress').textContent = `0 / ${interviewQuestions.length}`;
  if (document.getElementById('interview-question')) document.getElementById('interview-question').textContent = 'Choose a language and start the mock interview. The agent will ask one question at a time.';
  if (document.getElementById('interview-transcript')) document.getElementById('interview-transcript').value = '';
  if (document.getElementById('interview-summary')) document.getElementById('interview-summary').innerHTML = '<span class="text-sm" style="color:var(--text-muted);">Your practice summary will appear here when you finish.</span>';
  setInterviewStatus('Microphone is off');
}

function setInterviewStatus(message) {
  const status = document.getElementById('interview-status');
  if (status) status.textContent = message;
}

function extractSpeechTranscript(results) {
  if (!results || !results.length) return '';
  let text = '';
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const pieces = [];
    for (let j = 0; j < result.length; j++) {
      const chunk = result[j] && result[j].transcript ? result[j].transcript : '';
      if (chunk) pieces.push(chunk.trim());
    }
    if (pieces.length) text += `${pieces.join(' ')} `;
  }
  return text.trim();
}

function buildInterviewDiagnostics(answer, questionText) {
  const text = String(answer || '').trim();
  if (!text) {
    return {
      score: 0,
      headline: 'No answer captured',
      strengths: 'No answer was captured yet.',
      improvement: 'Speak clearly and answer with a short situation, action, and result.'
    };
  }

  const lower = text.toLowerCase();
  let score = 35;
  if (text.length > 50) score += 15;
  if (text.length > 120) score += 12;
  if (text.length > 220) score += 8;
  if (/(problem|issue|bug|debug|optimi|design|security|monitor|performance|project|team|solution|result)/i.test(lower)) score += 15;
  if (/(because|therefore|first|then|finally|after|when|while|so|as a result)/i.test(lower)) score += 10;
  if (/(i worked|i used|we built|we improved|we resolved|i handled|i analyzed)/i.test(lower)) score += 8;
  if (/(team|teammate|stakeholder|customer|manager|user)/i.test(lower)) score += 7;

  const normalized = Math.min(100, Math.max(0, score));
  const strengths = normalized >= 80
    ? 'Strong structure and clear examples.'
    : normalized >= 60
      ? 'Good substance with room to make the answer more specific.'
      : 'The answer needs clearer structure and more concrete examples.';

  const improvement = normalized >= 80
    ? 'Keep using the STAR format: Situation, Task, Action, Result.'
    : 'Add a specific problem, the action you took, and the measurable outcome.';

  return {
    score: normalized,
    headline: normalized >= 80 ? 'Strong interview answer' : normalized >= 60 ? 'Solid answer' : 'Needs more depth',
    strengths,
    improvement,
    questionText
  };
}

function calculateInterviewScore(answers) {
  if (!answers || !answers.length) return 0;
  const total = answers.reduce((sum, answer) => {
    const diagnostics = buildInterviewDiagnostics(answer, '');
    return sum + diagnostics.score;
  }, 0);
  return Math.min(100, Math.round(total / answers.length));
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
  const transcript = document.getElementById('interview-transcript')?.value.trim();
  const nextButton = document.getElementById('interview-next-btn');
  if (nextButton) nextButton.disabled = !transcript;
  setInterviewStatus(transcript ? 'Answer ready. Review it and continue.' : 'Ready for your answer');
}

function startVoiceInterview() {
  resetInterviewView();
  voiceInterview.sessionStarted = true;
  const question = interviewQuestions[0];
  const text = voiceInterview.language === 'ta-IN' ? question.ta : question.en;
  document.getElementById('interview-question-number').textContent = 'Question 1';
  document.getElementById('interview-progress').textContent = `1 / ${interviewQuestions.length}`;
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
    if (voiceInterview.recognition) {
      try { voiceInterview.recognition.stop(); } catch (err) {}
    }
    voiceInterview.listening = false;
    setInterviewStatus('Microphone stopped. You can speak again or type your answer manually.');
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setInterviewStatus('Microphone access is not available in this browser. Please type your answer instead.');
    return;
  }

  setInterviewStatus('Requesting microphone access...');
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(() => {
      const recognition = new Recognition();
      recognition.lang = voiceInterview.language === 'ta-IN' ? 'ta-IN' : 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 3;

      voiceInterview.recognition = recognition;
      voiceInterview.listening = true;
      voiceInterview.lastTranscript = '';

      recognition.onstart = () => setInterviewStatus('Listening... Speak clearly into the mic.');

      recognition.onresult = event => {
        const resultText = extractSpeechTranscript(event.results);
        if (!resultText) return;

        const transcriptBox = document.getElementById('interview-transcript');
        if (transcriptBox) transcriptBox.value = resultText;
        voiceInterview.lastTranscript = resultText;
        updateInterviewAnswerState();
      };

      recognition.onerror = event => {
        const errorMessage = event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone permission was denied. Please allow mic access, or type your answer manually.'
          : event.error === 'no-speech'
            ? 'No speech was detected. Please speak clearly and try again.'
            : `Voice input error: ${event.error}. Please type your answer instead.`;
        setInterviewStatus(errorMessage);
        voiceInterview.listening = false;
        if (voiceInterview.recognition) {
          try { voiceInterview.recognition.stop(); } catch (err) {}
        }
      };

      recognition.onend = () => {
        voiceInterview.listening = false;
        const transcriptBox = document.getElementById('interview-transcript');
        const typedValue = transcriptBox ? transcriptBox.value.trim() : '';

        if (typedValue && typedValue.length >= 5) {
          setInterviewStatus('Answer ready. Review it and continue.');
          const nextButton = document.getElementById('interview-next-btn');
          if (nextButton) nextButton.disabled = false;
          return;
        }

        const fallbackCapture = voiceInterview.lastTranscript ? voiceInterview.lastTranscript.trim() : '';
        if (fallbackCapture && fallbackCapture.length >= 5) {
          if (transcriptBox) transcriptBox.value = fallbackCapture;
          updateInterviewAnswerState();
          setInterviewStatus('Answer ready. Review it and continue.');
          return;
        }

        setInterviewStatus('No answer captured. Please type your answer or allow the microphone and speak clearly again.');
      };

      try {
        recognition.start();
      } catch (err) {
        voiceInterview.listening = false;
        setInterviewStatus('The microphone is already active. Please wait a moment and try again.');
      }
    })
    .catch(err => {
      const message = err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
        ? 'Microphone permission was denied. Please click Allow when the browser asks, or type your answer manually.'
        : 'Microphone access could not be started. Please type your answer instead.';
      setInterviewStatus(message);
    });
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
  document.getElementById('interview-progress').textContent = `${voiceInterview.questionIndex + 1} / ${interviewQuestions.length}`;
  document.getElementById('interview-question').textContent = text;
  document.getElementById('interview-transcript').value = '';
  document.getElementById('interview-next-btn').disabled = true;
  setInterviewStatus('Ready for your answer');
  speakInterviewQuestion(text);
}

function finishVoiceInterview() {
  if (voiceInterview.recognition && voiceInterview.listening) voiceInterview.recognition.stop();
  const answered = voiceInterview.answers.length;
  const score = calculateInterviewScore(voiceInterview.answers);
  const coachCards = voiceInterview.answers.map((answer, index) => {
    const question = interviewQuestions[index] || null;
    const diagnostics = buildInterviewDiagnostics(answer, question ? (voiceInterview.language === 'ta-IN' ? question.ta : question.en) : '');
    return `
      <div class="mb-3 p-2 rounded" style="background: rgba(37,99,235,0.06); border: 1px solid rgba(37,99,235,0.12);">
        <div class="text-xs" style="font-weight:700; color:var(--text-blue);">Q${index + 1} • ${diagnostics.score}/100</div>
        <div class="text-sm mt-1">${answer.slice(0, 220)}${answer.length > 220 ? '…' : ''}</div>
        <div class="text-xs mt-2" style="color:var(--text-muted);"><strong>Coach:</strong> ${diagnostics.strengths}</div>
      </div>
    `;
  }).join('');

  document.getElementById('interview-question-number').textContent = 'Practice complete';
  document.getElementById('interview-progress').textContent = `${answered} / ${interviewQuestions.length} answered`;
  document.getElementById('interview-question').textContent = 'Good work. Review your answers and repeat the round to improve clarity and structure.';
  document.getElementById('interview-start-btn').disabled = false;
  document.getElementById('interview-next-btn').disabled = true;
  document.getElementById('interview-listen-btn').disabled = true;
  document.getElementById('interview-summary').innerHTML = `
    <div class="mb-3"><strong>${answered}/${interviewQuestions.length} responses captured</strong></div>
    <div class="mb-3"><strong>Overall mock score:</strong> ${score}/100</div>
    <div class="mt-2">${coachCards || '<p class="text-sm mt-2">No answers recorded yet.</p>'}</div>
    <p class="text-sm mt-2">Use the STAR structure: Situation, Task, Action, Result. Shorter answers are fine, but make them specific and measurable.</p>
  `;
  setInterviewStatus('Session complete');
  if ('speechSynthesis' in window) speakInterviewQuestion(voiceInterview.language === 'ta-IN' ? 'நன்றி. உங்கள் நேர்காணல் பயிற்சி முடிந்தது. உங்களின் பதில்களை மீண்டும் படித்து, சிறப்பான பதிலை உருவாக்குங்கள்.' : 'Thank you. Your interview practice is complete. Review your answers and aim for clearer examples and measurable results.');
}

// STUDENT LOADERS
async function loadDashboardHome() {
  try {
    const dashboard = await apiFetch('/student/dashboard');
    const completion = dashboard.profileCompletion || { percentage: 0, missingItems: [] };
    const welcomeHeader = document.getElementById('welcome-header');
    if (welcomeHeader) {
      const name = (dashboard.profile && dashboard.profile.name) || (currentProfile && currentProfile.name) || 'Student';
      welcomeHeader.textContent = `Welcome back, ${name}`;
    }

    const profilePct = document.getElementById('dash-profile-pct');
    const profileBar = document.getElementById('dash-profile-bar');
    if (profilePct) profilePct.textContent = `${completion.percentage}%`;
    if (profileBar) profileBar.style.width = `${completion.percentage}%`;

    const missingItems = document.getElementById('dash-missing-items');
    if (missingItems) {
      const items = Array.isArray(completion.missingItems) && completion.missingItems.length ? completion.missingItems : ['Profile complete'];
      missingItems.innerHTML = items.slice(0, 4).map(item => `<span class="badge-saas badge-blue">${item}</span>`).join('');
    }

    document.getElementById('stat-cgpa').textContent = Number((dashboard.profile && dashboard.profile.cgpa) || 0).toFixed(2);
    document.getElementById('stat-skills').textContent = dashboard.technicalSkills || 0;
    document.getElementById('stat-projects').textContent = dashboard.projects || 0;
    document.getElementById('stat-certs').textContent = dashboard.certificates || 0;
    document.getElementById('stat-apps').textContent = dashboard.applications || 0;
    document.getElementById('stat-score').textContent = `${dashboard.skillScore || 0} / 100`;
    if (document.getElementById('mini-portfolio-score')) document.getElementById('mini-portfolio-score').textContent = `${dashboard.skillScore || 0}`;
    if (document.getElementById('mini-skill-score')) document.getElementById('mini-skill-score').textContent = dashboard.technicalSkills || 0;
    if (document.getElementById('mini-cert-score')) document.getElementById('mini-cert-score').textContent = dashboard.certificates || 0;
    if (document.getElementById('mini-project-score')) document.getElementById('mini-project-score').textContent = dashboard.projects || 0;

    const recContainer = document.getElementById('dash-recommended-jobs');
    const jobs = dashboard.recommendedJobs || [];
    recContainer.innerHTML = jobs.length ? jobs.map(j => `
      <div class="saas-card">
        <div class="badge-saas badge-purple mb-2">${j.match_percentage || 0}% MATCH</div>
        <h4 style="font-weight:700;">${j.title}</h4>
        <div style="font-size:0.8rem; color:var(--text-blue); font-weight:700;" class="mb-2">${j.company_name || 'Company'}</div>
        <button class="btn-saas btn-primary w-full" onclick="navigateTo('opportunities')">View & Apply</button>
      </div>
    `).join('') : '<div class="saas-card">Add more skills and projects to unlock role recommendations.</div>';
  } catch (e) {
    console.error('Dashboard load failed', e);
  }
}

async function loadProfileView() {
  try {
    const data = await apiFetch('/student/profile');
    const p = data.profile || {};
    const onboardingCard = document.getElementById('profile-onboarding-card');
    document.getElementById('prof-name').value = p.name || '';
    document.getElementById('prof-phone').value = p.phone || '';
    document.getElementById('prof-college').value = p.college || '';
    document.getElementById('prof-linkedin').value = p.linkedin_url || '';
    document.getElementById('prof-github').value = p.github_url || '';
    document.getElementById('prof-portfolio').value = p.portfolio_url || '';
    const resume = data.resume || null;
    if (document.getElementById('resume-url')) document.getElementById('resume-url').value = resume ? (resume.file_url || '') : (p.resume_url || '');
    if (document.getElementById('resume-status')) document.getElementById('resume-status').textContent = resume ? `${resume.status || 'Active'} • ${resume.file_name || 'Resume'}` : 'No resume uploaded';
    if (onboardingCard) {
      const incomplete = p.onboarding_complete === false || p.onboarding_complete === undefined;
      onboardingCard.classList.toggle('hidden', !incomplete);
    }
  } catch (e) {}
}

async function handleResumeUpload(event) {
  event.preventDefault();
  const fileInput = document.getElementById('resume-file-input');
  const urlInput = document.getElementById('resume-url');
  const resumeFile = fileInput && fileInput.files && fileInput.files[0];
  const resumeUrl = (urlInput ? urlInput.value.trim() : '').trim();

  if (!resumeFile && !resumeUrl) {
    alert('Upload a resume file or add a resume URL before saving.');
    return;
  }

  try {
    let finalUrl = resumeUrl;
    if (resumeFile) finalUrl = await readFileAsDataUrl(resumeFile);
    await apiFetch('/student/resume', {
      method: 'POST',
      body: JSON.stringify({
        fileUrl: finalUrl,
        resumeUrl: finalUrl,
        fileName: resumeFile ? resumeFile.name : 'Resume.pdf'
      })
    });
    if (fileInput) fileInput.value = '';
    alert('Resume uploaded successfully.');
    await loadProfileView();
    await loadDashboardHome();
  } catch (err) {
    alert(err.message || 'Resume upload failed.');
  }
}

async function submitStudentOnboarding() {
  try {
    const ragging = document.getElementById('onboarding-ragging')?.checked;
    const consent = document.getElementById('onboarding-consent')?.checked;
    if (!ragging || !consent) {
      alert('Please accept the anti-ragging policy and the data consent to continue.');
      return;
    }

    const profile = {
      onboarding_complete: true,
      consent: { data_usage: true, ai_matching: true, chatbot_memory: false },
      anti_ragging_acknowledged: true
    };
    const response = await apiFetch('/student/onboarding', {
      method: 'POST',
      body: JSON.stringify({ profile, consent: { anti_ragging: ragging, data_consent: consent } })
    });
    currentProfile = response.profile || currentProfile;
    document.getElementById('profile-onboarding-card').classList.add('hidden');
    alert('Onboarding completed successfully.');
  } catch (err) {
    alert(err.message || 'Unable to complete onboarding.');
  }
}

async function handleSaveProfile(e) {
  e.preventDefault();
  try {
    const data = await apiFetch('/student/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: document.getElementById('prof-name').value.trim(),
        phone: document.getElementById('prof-phone').value.trim(),
        college: document.getElementById('prof-college').value.trim(),
        linkedin_url: document.getElementById('prof-linkedin').value.trim(),
        github_url: document.getElementById('prof-github').value.trim(),
        portfolio_url: document.getElementById('prof-portfolio').value.trim()
      })
    });
    currentProfile = data.profile;
    alert('Profile updated!');
  } catch (err) { alert(err.message || 'Profile update failed.'); }
}
async function loadAcademicsView() {
  try {
    const data = await apiFetch('/student/academics');
    const tbody = document.getElementById('semester-table-body');
    tbody.innerHTML = (data.records || []).map(r => `<tr><td style="font-weight:700;">${r.semester}</td><td>${r.gpa.toFixed(2)}</td><td><span class="badge-saas badge-emerald">${r.status}</span></td></tr>`).join('');
  } catch (e) {}
}
async function loadSkillsView() {
  try {
    const data = await apiFetch('/student/skills');
    const skillList = document.getElementById('technical-skills-list');
    const skills = data.technical || [];

    if (!skillList) return;
    if (!skills.length) {
      skillList.innerHTML = `
        <div class="saas-card text-center">
          <p style="color: var(--text-muted); margin-bottom: 1rem;">No technical skills added yet.</p>
          <button class="btn-saas btn-primary" type="button" onclick="document.getElementById('skill-name').focus()">Add Skills</button>
        </div>
      `;
      return;
    }

    skillList.innerHTML = skills.map(skill => `
      <div class="saas-card">
        <div class="flex-between gap-3 mb-2">
          <div>
            <strong>${skill.skill_name || skill.name || 'Skill'}</strong>
            <div style="font-size:0.75rem; color: var(--text-muted);">${skill.category || 'Other'} • ${skill.proficiencyPercentage || skill.level_pct || 0}%</div>
          </div>
          <span class="badge-saas badge-purple">${Number(skill.scoreOutOfTen || (Number(skill.level_pct || 0) / 10)).toFixed(1)}/10</span>
        </div>
        <div class="progress-track mb-2"><div class="progress-fill" style="width: ${skill.proficiencyPercentage || skill.level_pct || 0}%"></div></div>
        <button class="btn-saas btn-outline" type="button" onclick="deleteSkill(${skill.id})">Delete</button>
      </div>
    `).join('');
  } catch (e) {
    console.error('Skills load failed', e);
  }
}

async function handleAddSkillSubmit(event) {
  event.preventDefault();
  const skillName = document.getElementById('skill-name')?.value.trim();
  const category = document.getElementById('skill-category')?.value || 'Other';
  const proficiency = Number(document.getElementById('skill-proficiency')?.value || 0);

  if (!skillName || !Number.isFinite(proficiency) || proficiency < 0 || proficiency > 100) {
    alert('Enter a valid skill name and percentage between 0 and 100.');
    return;
  }

  try {
    await apiFetch('/student/skills', {
      method: 'POST',
      body: JSON.stringify({ skillName, category, proficiencyPercentage: proficiency })
    });
    document.getElementById('skill-form').reset();
    await loadSkillsView();
    await loadDashboardHome();
    alert('Skill saved successfully.');
  } catch (err) {
    alert(err.message || 'Unable to save skill.');
  }
}

async function deleteSkill(skillId) {
  try {
    await apiFetch(`/student/skills/${skillId}`, { method: 'DELETE' });
    await loadSkillsView();
    await loadDashboardHome();
  } catch (err) {
    alert(err.message || 'Unable to delete skill.');
  }
}
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
    const projects = data.projects || [];
    const certificates = data.certifications || [];
    const projectList = document.getElementById('portfolio-project-list');
    const certList = document.getElementById('portfolio-certificate-list');

    if (projectList) {
      projectList.innerHTML = projects.length ? projects.map(project => `
        <div class="saas-card mb-3">
          <div class="flex-between gap-3 mb-2">
            <div>
              <h4 style="font-weight:700; margin:0;">${project.title}</h4>
              <div style="font-size:0.78rem; color:var(--text-muted);">${project.category || 'Project'}</div>
            </div>
            <span class="badge-saas badge-emerald">${project.status || 'Completed'}</span>
          </div>
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom: 0.75rem;">${project.description || 'Project details not added yet.'}</p>
          <div class="flex-align gap-2 flex-wrap">
            ${project.projectUrl ? `<a class="btn-saas btn-outline" href="${project.projectUrl}" target="_blank" rel="noreferrer">Live</a>` : ''}
            ${project.githubUrl ? `<a class="btn-saas btn-outline" href="${project.githubUrl}" target="_blank" rel="noreferrer">GitHub</a>` : ''}
            <button class="btn-saas btn-outline" type="button" onclick="deleteStudentProject(${project.id})">Delete</button>
          </div>
        </div>
      `).join('') : '<div class="saas-card"><p style="color:var(--text-muted); margin:0;">No project entries yet.</p></div>';
    }

    if (certList) {
      certList.innerHTML = certificates.length ? certificates.map(cert => `
        <div class="saas-card mb-3">
          <div class="flex-between gap-3 mb-2">
            <div>
              <h4 style="font-weight:700; margin:0;">${cert.certificateName || cert.name || 'Certificate'}</h4>
              <div style="font-size:0.78rem; color:var(--text-muted);">${cert.issuer || 'Issuer'}</div>
            </div>
            <span class="badge-saas badge-purple">${cert.issueDate || '—'}</span>
          </div>
          <div class="flex-align gap-2 flex-wrap">
            ${cert.certificateUrl ? `<a class="btn-saas btn-outline" href="${cert.certificateUrl}" target="_blank" rel="noreferrer">Open</a>` : ''}
            ${cert.fileUrl ? `<a class="btn-saas btn-outline" href="${cert.fileUrl}" target="_blank" rel="noreferrer">File</a>` : ''}
            <button class="btn-saas btn-outline" type="button" onclick="deleteStudentCertificate(${cert.id})">Delete</button>
          </div>
        </div>
      `).join('') : '<div class="saas-card"><p style="color:var(--text-muted); margin:0;">No certificates uploaded yet.</p></div>';
    }
  } catch (e) {
    console.error('Portfolio load failed', e);
  }
}

async function handleAddCertificateSubmit(event) {
  event.preventDefault();
  const fileInput = document.getElementById('cert-file-upload');
  const payload = {
    certificateName: document.getElementById('cert-name')?.value.trim(),
    issuer: document.getElementById('cert-issuer')?.value.trim(),
    issueDate: document.getElementById('cert-date')?.value,
    credentialId: document.getElementById('cert-id')?.value.trim(),
    certificateUrl: document.getElementById('cert-url')?.value.trim(),
    fileUrl: document.getElementById('cert-file')?.value.trim(),
    description: document.getElementById('cert-desc')?.value.trim()
  };

  if (fileInput && fileInput.files && fileInput.files[0]) {
    payload.fileUrl = await readFileAsDataUrl(fileInput.files[0]);
  }

  if (!payload.certificateName || (!payload.certificateUrl && !payload.fileUrl)) {
    alert('Certificate name and either a URL or uploaded file are required.');
    return;
  }

  try {
    await apiFetch('/student/certificates', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    document.getElementById('certificate-form').reset();
    if (fileInput) fileInput.value = '';
    await loadPortfolioView();
    await loadDashboardHome();
    alert('Certificate saved successfully.');
  } catch (err) {
    alert(err.message || 'Unable to save certificate.');
  }
}

async function deleteStudentCertificate(certificateId) {
  try {
    await apiFetch(`/student/certificates/${certificateId}`, { method: 'DELETE' });
    await loadPortfolioView();
    await loadDashboardHome();
  } catch (err) {
    alert(err.message || 'Unable to delete certificate.');
  }
}

async function handleAddProjectSubmit(event) {
  event.preventDefault();
  const imageInput = document.getElementById('project-image-upload');
  const payload = {
    title: document.getElementById('project-title')?.value.trim(),
    description: document.getElementById('project-desc')?.value.trim(),
    category: document.getElementById('project-category')?.value,
    technologies: document.getElementById('project-tech')?.value.trim(),
    githubUrl: document.getElementById('project-github')?.value.trim(),
    projectUrl: document.getElementById('project-url')?.value.trim(),
    status: document.getElementById('project-status')?.value || 'Completed',
    imageUrl: ''
  };

  if (imageInput && imageInput.files && imageInput.files[0]) {
    payload.imageUrl = await readFileAsDataUrl(imageInput.files[0]);
  }

  if (!payload.title || !payload.description) {
    alert('Project title and description are required.');
    return;
  }

  try {
    await apiFetch('/student/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    document.getElementById('project-form').reset();
    if (imageInput) imageInput.value = '';
    await loadPortfolioView();
    await loadDashboardHome();
    alert('Project saved successfully.');
  } catch (err) {
    alert(err.message || 'Unable to save project.');
  }
}

async function deleteStudentProject(projectId) {
  try {
    await apiFetch(`/student/projects/${projectId}`, { method: 'DELETE' });
    await loadPortfolioView();
    await loadDashboardHome();
  } catch (err) {
    alert(err.message || 'Unable to delete project.');
  }
}

async function loadSettingsView() {
  try {
    const data = await apiFetch('/student/settings');
    const form = document.getElementById('student-settings-form');
    if (!form) return;
    document.getElementById('settings-job-notifications').checked = !!(data.jobNotifications ?? true);
    document.getElementById('settings-internship-notifications').checked = !!(data.internshipNotifications ?? true);
    document.getElementById('settings-placement-notifications').checked = !!(data.placementNotifications ?? true);
    document.getElementById('settings-profile-visibility').value = data.profileVisibility || 'public';
    document.getElementById('settings-dark-mode').checked = !!(data.darkMode ?? false);
    document.getElementById('settings-recruiter-discovery').checked = !!(data.recruiterDiscovery ?? true);
    document.getElementById('settings-hide-email').checked = !!(data.hideEmail ?? false);
  } catch (e) {
    console.error('Settings load failed', e);
  }
}

async function handleSaveSettings(event) {
  event.preventDefault();
  const payload = {
    jobNotifications: document.getElementById('settings-job-notifications').checked,
    internshipNotifications: document.getElementById('settings-internship-notifications').checked,
    placementNotifications: document.getElementById('settings-placement-notifications').checked,
    recruiterDiscovery: document.getElementById('settings-recruiter-discovery').checked,
    profileVisibility: document.getElementById('settings-profile-visibility').value,
    darkMode: document.getElementById('settings-dark-mode').checked,
    hideEmail: document.getElementById('settings-hide-email').checked,
    theme: document.getElementById('settings-dark-mode').checked ? 'dark' : 'light'
  };

  try {
    await apiFetch('/student/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    alert('Settings saved successfully.');
  } catch (err) {
    alert(err.message || 'Unable to save settings.');
  }
}

async function handleAiChatSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('ai-chat-input');
  const chatLog = document.getElementById('ai-chat-log');
  const message = input.value.trim();
  if (!message) return;
  chatLog.innerHTML += `<div class="chat-bubble user">${message}</div>`;
  input.value = '';
  try {
    const data = await apiFetch('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    chatLog.innerHTML += `<div class="chat-bubble bot">${data.reply || 'I can help with your career goals.'}</div>`;
    chatLog.scrollTop = chatLog.scrollHeight;
  } catch (err) {
    chatLog.innerHTML += `<div class="chat-bubble bot">Unable to reach AI support right now.</div>`;
  }
}

async function loadAISkillAnalyzerView() {
  try {
    const data = await apiFetch('/ai/skill-analysis');
    const overview = data.overallScore || 0;
    const breakdownEl = document.getElementById('ai-score-breakdown');
    const matchEl = document.getElementById('ai-match-pct');
    if (matchEl) matchEl.textContent = `${overview}% Match`;
    if (breakdownEl) {
      const cards = (data.skills || []).map(skill => `
        <div class="saas-card mb-3">
          <div class="flex-between mb-2"><h4 style="font-weight: 700;">${skill.skillName}</h4><span class="badge-saas badge-purple">${skill.score}/100</span></div>
          <div class="text-xs mb-2" style="color: var(--text-muted);">Confidence: ${skill.confidence}</div>
          <div class="text-sm mb-2"><strong>Evidence:</strong> ${skill.evidence.join('; ')}</div>
          <div class="text-sm mb-2"><strong>Strengths:</strong> ${skill.strengths.join('; ')}</div>
          <div class="text-sm"><strong>Improve:</strong> ${skill.recommendations.join('; ')}</div>
        </div>
      `).join('');

      breakdownEl.innerHTML = `
        <div class="saas-card mt-2">
          <h3 style="font-weight:800; margin-bottom: 1rem;">Skill-Fit Score Breakdown</h3>
          <div class="grid-2 gap-3 mb-3">
            <div><strong>Assessment:</strong> ${data.factors?.assessment || 0}%</div>
            <div><strong>Projects:</strong> ${data.factors?.projects || 0}%</div>
            <div><strong>Certificates:</strong> ${data.factors?.certificates || 0}%</div>
            <div><strong>Internships:</strong> ${data.factors?.internships || 0}%</div>
            <div><strong>Resume:</strong> ${data.factors?.resume || 0}%</div>
            <div><strong>Self Rating:</strong> ${data.factors?.selfRating || 0}%</div>
          </div>
          ${cards || '<div class="saas-card">Add skills and evidence to generate a real analysis.</div>'}
        </div>
      `;
    }
  } catch (e) {
    console.error('AI skill analysis failed', e);
  }
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
    document.getElementById('applications-list-container').innerHTML = apps.map(a => `
      <div class="saas-card mb-3 flex-between application-row">
        <div>
          <h4 style="font-weight:700;">${a.job_title}</h4>
          <div style="font-size:0.85rem; color:var(--text-blue);">${a.company_name}</div>
          <div class="text-xs mt-2" style="color:var(--text-muted);">${a.interview ? `Interview: ${a.interview.date} at ${a.interview.time}` : 'Application in progress'}</div>
        </div>
        <div class="flex-align gap-2">
          <span class="badge-saas badge-emerald">${a.status}</span>
          ${a.interview ? '<button class="btn-saas btn-primary" onclick="navigateTo(\'interview-prep\')"><i class="fa-solid fa-microphone-lines"></i> Practice</button>' : ''}
        </div>
      </div>
    `).join('') || '<div class="saas-card">No applications yet.</div>';
  } catch (e) {}
}
async function loadNotificationsView() {
  try {
    const list = await apiFetch('/student/notifications');
    document.getElementById('notifications-list-container').innerHTML = list.map(n => `
      <div class="saas-card mb-3 ${n.is_read ? '' : 'notification-unread'}">
        <div class="flex-between gap-2 mb-2">
          <h4 style="font-weight:700;">${n.title}</h4>
          ${n.is_read ? '<span class="badge-saas badge-emerald">Read</span>' : '<span class="badge-saas badge-blue">New</span>'}
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted);">${n.message}</p>
        ${n.id && !n.is_read ? `<button class="btn-saas btn-outline mt-3" onclick="markNotificationRead(${n.id})">Mark as read</button>` : ''}
      </div>
    `).join('');
  } catch (e) {}
}

async function markNotificationRead(notificationId) {
  try {
    await apiFetch(`/student/notifications/${notificationId}/read`, { method: 'PUT' });
    loadNotificationsView();
  } catch (err) { console.error(err.message); }
}

async function loadPlacementView() {
  try {
    const data = await apiFetch('/student/placement');
    const placement = data.placement;
    const container = document.getElementById('placement-details-container');
    if (!placement) {
      container.innerHTML = '<div class="saas-card"><p style="color:var(--text-muted);">No placement record saved yet. Add your offer details from the student profile flow.</p></div>';
      return;
    }
    container.innerHTML = `
      <div class="saas-card mb-4">
        <div class="flex-between mb-3">
          <div>
            <div class="badge-saas badge-emerald mb-2">${placement.status || 'Offer Received'}</div>
            <h3 style="font-weight:800; margin:0;">${placement.companyName || placement.company || 'Company'}</h3>
          </div>
          <div style="font-weight:800; color:var(--text-blue); font-size:1.2rem;">${placement.role || 'Role'}</div>
        </div>
        <div class="grid-2 gap-4 text-sm" style="color:var(--text-muted);">
          <div><strong>Package:</strong> ${placement.package || placement.salary || '—'}</div>
          <div><strong>Location:</strong> ${placement.location || '—'}</div>
          <div><strong>Joining Date:</strong> ${placement.joiningDate || '—'}</div>
          <div><strong>Updated:</strong> ${placement.updatedAt ? new Date(placement.updatedAt).toLocaleDateString() : '—'}</div>
        </div>
      </div>
    `;
  } catch (e) {}
}

async function loadCampusDrivesView() {
  try {
    const drives = await apiFetch('/student/campus-drives');
    const container = document.getElementById('campus-drives-list-container');
    container.innerHTML = drives.map(drive => `
      <div class="saas-card mb-4">
        <div class="flex-between mb-3">
          <div>
            <h3 style="font-weight:800; margin:0;">${drive.company}</h3>
            <div style="font-size:0.8rem; color:var(--text-muted);">${drive.role} • ${drive.location}</div>
          </div>
          <span class="badge-saas ${drive.eligible ? 'badge-emerald' : 'badge-purple'}">${drive.eligible ? 'Eligible' : 'Not Eligible'}</span>
        </div>
        <div class="grid-2 gap-3 text-sm mb-3" style="color:var(--text-muted);">
          <div><strong>Date:</strong> ${drive.date}</div>
          <div><strong>Deadline:</strong> ${drive.deadline}</div>
          <div><strong>CGPA:</strong> ${drive.minimumCGPA || '—'}+</div>
          <div><strong>Salary:</strong> ${drive.salary || '—'}</div>
        </div>
        <p class="mb-3" style="font-size:0.82rem; color:var(--text-muted);">${drive.reason || 'No restrictions.'}</p>
        <button class="btn-saas ${drive.eligible ? 'btn-primary' : 'btn-outline'}" ${drive.eligible ? '' : 'disabled'} onclick="registerCampusDrive(${drive.id})">
          ${drive.registered ? 'Registered' : 'Register Now'}
        </button>
      </div>
    `).join('');
  } catch (e) {}
}

async function registerCampusDrive(driveId) {
  try {
    await apiFetch(`/student/campus-drives/${driveId}/register`, { method: 'POST' });
    loadCampusDrivesView();
    alert('Campus drive registration saved successfully.');
  } catch (err) {
    alert(err.message || 'Unable to register for campus drive.');
  }
}

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
    const students = await apiFetch('/college/students');
    document.getElementById('talent-candidates-list').innerHTML = students.map(s => `<div class="saas-card"><h4 style="font-weight:700;">${s.name}</h4><div style="font-size:0.8rem; color:var(--text-muted);">${s.college} • ${s.department}</div><div style="font-size:0.85rem; font-weight:800; color:var(--text-emerald);" class="mt-2">CGPA: ${s.cgpa || 8.8}</div></div>`).join('');
  } catch (e) {}
}

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
