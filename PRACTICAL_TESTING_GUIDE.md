# SkillBridge - Practical Testing Guide
## Step-by-Step Manual Testing Instructions

---

## 🚀 QUICK START

### Backend Server Status
✅ **Server Running on:** http://localhost:3000

### Server Output Expected:
```
================================================================
 SkillBridge Unique 3-Portal Backend Engine Running on Port 3000
================================================================
```

---

## 📋 TEST ACCOUNTS AVAILABLE

Use these accounts to test each role:

### 1️⃣ STUDENT ACCOUNT
```
Username: student1
Email: student@example.com
Password: password123
Student ID: SB2026ST001
```

### 2️⃣ COMPANY ACCOUNT
```
Company: TechCorp
Email: recruiter@techcorp.com
Password: password123
```

### 3️⃣ COLLEGE ADMIN ACCOUNT
```
Email: admin@college.com
Password: password123
Role: College Admin
College: Engineering Institute
```

### 4️⃣ UNIVERSITY ADMIN ACCOUNT
```
Email: admin@university.com
Password: password123
Role: University Admin
University: State University
```

### 5️⃣ SUPER ADMIN ACCOUNT
```
Email: admin@skillbridge.com
Password: password123
Role: Super Admin
```

---

## 🧪 TEST SCENARIO 1: STUDENT ROLE

### Step 1: Login as Student
1. Open: **http://localhost:3000**
2. Enter credentials:
   - Username: `student1`
   - Password: `password123`
3. Click "Login"
4. **Expected:** Dashboard loads with student welcome message

### Step 2: Verify AI Context (Student)
1. Open browser **Developer Tools** (F12)
2. Go to **Network** tab
3. In the app, look for AI Assistant greeting
4. **Expected Greeting:** 
   ```
   "Hi [Student Name]! 👋 I'm your personal career guide. 
   Let's build your path to success!"
   ```
5. Check Network tab for: `GET /api/ai/context`
6. **Expected Response:**
   ```json
   {
     "role": "student",
     "greeting": "Hi [Name]! ...",
     "assistantTitle": "Your Career Assistant"
   }
   ```

### Step 3: Verify Student Navigation
1. Look at the left sidebar menu
2. **Expected Menu Items (in order):**
   - 📊 Dashboard
   - 👤 My Profile
   - 📚 Academics
   - 🎯 Skills
   - 📜 Certificates
   - 💼 Projects
   - 🎯 Talent Finder
   - 🏢 Campus Drives
   - 📋 Applications
   - 🎓 Placement
   - 🔔 Notifications
   - ⚙️ Settings

### Step 4: Test Dashboard (Read-Only Mode)
1. Click "My Profile" in sidebar
2. **Verify:** Profile data displays as read-only
   - Name appears as text, not input field
   - "✎ Edit" button appears next to each field
3. Click the "✎ Edit" button next to Name
4. **Expected:** Name field becomes editable (converts to input)
5. Change name to: "Test Student"
6. Click "💾 Save"
7. **Expected:** 
   - API call sent to backend
   - Alert shows: "Profile updated successfully"
   - Field returns to read-only mode
8. Refresh the page (Ctrl+R)
9. **Expected:** Name still shows "Test Student" (data persisted)
10. Click "✎ Edit" again and click "Cancel"
11. **Expected:** Field reverts to original value

### Step 5: Test Settings Page
1. Click "⚙️ Settings" in sidebar
2. Verify all 6 sections are present:

   **Section 1 - Account:**
   - [ ] Username field (editable)
   - [ ] Email field (editable)
   - [ ] Mobile field (editable)
   - [ ] Student ID field (read-only, should show "SB2026ST001")

   **Section 2 - Password:**
   - [ ] Current Password field
   - [ ] New Password field
   - [ ] Confirm Password field

   **Section 3 - Notifications:**
   - [ ] Job Matches (toggle)
   - [ ] Internships (toggle)
   - [ ] Campus Drives (toggle)
   - [ ] Application Updates (toggle)
   - [ ] Interview Updates (toggle)
   - [ ] Placement Updates (toggle)

   **Section 4 - Privacy:**
   - [ ] Profile Visibility (toggle)
   - [ ] Recruiter Discovery (toggle)
   - [ ] Show Skills (toggle)
   - [ ] Show Academic Info (toggle)
   - [ ] Show Contact Info (toggle)

   **Section 5 - Appearance:**
   - [ ] Theme selector (Light/Dark/System)

   **Section 6 - Account Control:**
   - [ ] Logout button
   - [ ] Delete Account button

3. Toggle the "Profile Visibility" setting
4. Click "Save" button
5. **Expected:** Toast/alert shows "Settings saved successfully"

### Step 6: Test Talent Finder (Student)
1. Click "🎯 Talent Finder" in sidebar
2. **Expected:** Page loads showing available jobs
3. Look for job cards with:
   - Job title
   - Company name
   - Match score (as percentage %)
   - "Perfect Match ⭐" / "Strong Match ✓" / etc.
   - Skills strengths and gaps
   - "Apply Now" button
4. Each card should have different match percentages
5. **Expected Match Score Example:**
   ```
   Software Developer - TechCorp
   92% | Perfect Match ⭐
   Strengths: Python, SQL, REST API
   Skills Gaps: Docker, Kubernetes
   [Apply Now]
   ```

### Step 7: Verify Student AI Suggestions
1. Look for AI Suggestions area in the interface
2. **Expected Suggestions (Student-specific):**
   - "What is my current CGPA?"
   - "Which jobs match my skills?"
   - "Show me my campus drive eligibility"
   - "How can I improve my resume?"
3. Click one suggestion
4. **Expected:** AI responds with student-relevant answer

### Step 8: Test Student Logout
1. Click "⚙️ Settings" → "Logout"
2. **Expected:** Redirected to login page
3. **Expected:** Login form is empty

**✅ STUDENT ROLE TESTING COMPLETE**

---

## 🧪 TEST SCENARIO 2: COMPANY ROLE

### Step 1: Login as Company
1. Open: **http://localhost:3000**
2. Click "Company" tab or "Switch to Company" (if available)
3. Enter credentials:
   - Company: `TechCorp`
   - Email: `recruiter@techcorp.com`
   - Password: `password123`
4. Click "Login"
5. **Expected:** Company dashboard loads

### Step 2: Verify Company AI Context
1. Open Browser DevTools (F12) → Network tab
2. Look for AI greeting
3. **Expected Greeting:**
   ```
   "Welcome to SkillBridge, TechCorp! 🚀 
   I'm your recruitment intelligence partner. 
   Let's find your perfect candidates."
   ```
4. Look for API call: `GET /api/ai/context`
5. **Expected Response:**
   ```json
   {
     "role": "company",
     "greeting": "Welcome to SkillBridge, TechCorp! ...",
     "assistantTitle": "Your Recruitment Assistant"
   }
   ```

### Step 3: Verify Company Navigation
1. Check left sidebar menu
2. **Expected Menu Items:**
   - 📊 Dashboard
   - 🏢 Company Profile
   - 💼 Job Posts
   - ➕ Create Job
   - 📋 Applications
   - 🎯 Talent Finder
   - ⭐ Shortlisted
   - 🏢 Campus Drives
   - 🎤 Interviews
   - 🔔 Notifications
   - ⚙️ Settings

### Step 4: View Company Dashboard
1. Click "📊 Dashboard"
2. **Expected to see:**
   - Total job postings (stat card)
   - Total applications (stat card)
   - Shortlisted count (stat card)
   - Application pipeline visualization
   - Recent applications list

### Step 5: Test Talent Finder (Company)
1. Click "🎯 Talent Finder" in sidebar
2. **Expected:** Shows list of company's job postings
3. Select a job (e.g., "Software Developer")
4. **Expected:** Candidate list appears with:
   - Student names (or "Anonymous" if privacy hidden)
   - Match percentage
   - Recommendation level
   - Skills list
   - CGPA (if student allowed showing)
   - "Shortlist" button
5. Each candidate card should show:
   ```
   Student Name (or Anonymous)
   92% | Strong Match ✓
   Skills: Python, SQL, REST API
   CGPA: 8.5/10
   [Shortlist]
   ```

### Step 6: Verify Company Cannot See Student Personal Data
1. Look at student cards in Talent Finder
2. **Verify:**
   - [ ] Personal phone number NOT visible
   - [ ] Personal email NOT visible (if privacy disabled)
   - [ ] Student's personal address NOT visible
   - [ ] Student's personal profile details NOT visible
3. **Expected:** Only relevant job-related data shown

### Step 7: Test Company Settings
1. Click "⚙️ Settings"
2. **Verify sections:**
   - Account (Company name, email, phone)
   - Password (change password)
   - Notifications (job application alerts, etc.)
   - Appearance (theme)
   - Account Control (logout, delete)

### Step 8: Test Company AI Suggestions
1. Look for AI suggestions area
2. **Expected Suggestions (Company-specific):**
   - "Find students with Java skills above 80%"
   - "Create a Software Developer job posting"
   - "Show me eligible candidates for this role"
   - "How many students match this job?"
3. Click one suggestion
4. **Expected:** AI responds with recruitment-relevant answer

### Step 9: Verify Company AI Doesn't Access Restricted Data
1. In the AI chat, try asking: "Show me student phone numbers"
2. **Expected:** AI refuses, saying something like:
   ```
   "I don't have access to student contact information. 
   Only the students who have enabled recruiter discovery 
   and contact sharing will be visible."
   ```

**✅ COMPANY ROLE TESTING COMPLETE**

---

## 🧪 TEST SCENARIO 3: COLLEGE ADMIN ROLE

### Step 1: Login as College Admin
1. Open: **http://localhost:3000**
2. Click "Admin" or "College Admin" option
3. Enter credentials:
   - Email: `admin@college.com`
   - Password: `password123`
4. Click "Login"
5. **Expected:** College admin dashboard loads

### Step 2: Verify College Admin AI Context
1. Check AI greeting
2. **Expected Greeting:**
   ```
   "Welcome, Engineering Institute Administrator! 📊 
   I'm here to help you manage student data and analytics."
   ```
3. **Expected Assistant Title:** "Your College Management Assistant"

### Step 3: Verify College Admin Navigation
1. Check sidebar menu
2. **Expected Menu Items:**
   - 📊 Dashboard
   - 🏢 College Profile
   - 👥 Students
   - 📊 Academic Analytics
   - 🎯 Skills Analysis
   - 🎓 Placements
   - 🏭 Companies
   - 🏢 Campus Drives
   - 📄 Reports
   - ⚙️ Settings

### Step 4: View College Admin Dashboard
1. Click "📊 Dashboard"
2. **Expected to see:**
   - Total Students (stat card)
   - Students by Department (stat card)
   - Placement Rate (stat card)
   - Academic Performance Distribution
   - Skill Trends
   - Department-wise statistics

### Step 5: Important: Verify College Admin Doesn't See Student's "My Profile"
1. Look at navigation and interface
2. **Verify:**
   - [ ] NO "My Profile" in sidebar (that's for students only)
   - [ ] Instead, shows "College Profile"
   - [ ] Shows "Students" menu item to view all students
3. **Expected:** Different interface from student mode

### Step 6: Test College Admin Settings
1. Click "⚙️ Settings"
2. Verify similar sections to student (Account, Password, Notifications, Appearance, Control)

### Step 7: Test College Admin AI Suggestions
1. Look for AI suggestions
2. **Expected Suggestions:**
   - "Show students with CGPA above 8.0"
   - "What are our placement statistics?"
   - "Generate placement report by department"
   - "Which skills are most common among our students?"

**✅ COLLEGE ADMIN ROLE TESTING COMPLETE**

---

## 🧪 TEST SCENARIO 4: UNIVERSITY ADMIN ROLE

### Step 1: Login as University Admin
1. Open: **http://localhost:3000**
2. Click "University Admin" option
3. Enter credentials:
   - Email: `admin@university.com`
   - Password: `password123`
4. Click "Login"
5. **Expected:** University admin dashboard loads

### Step 2: Verify University Admin AI Context
1. **Expected Greeting:**
   ```
   "Welcome, State University Administrator! 🎓 
   I'm here to help with university-wide analytics."
   ```
2. **Expected Assistant Title:** "Your University Analytics Assistant"

### Step 3: Verify University Admin Navigation
1. **Expected Menu Items:**
   - 📊 Dashboard
   - 🏫 University Profile
   - 🏢 Colleges
   - 👥 Students
   - 📊 Academic Analytics
   - 🎓 Placement Analytics
   - 🏭 Companies
   - 🏢 Campus Drives
   - 📄 Reports
   - ⚙️ Settings

### Step 4: View University Admin Dashboard
1. Click "📊 Dashboard"
2. **Expected to see:**
   - Total Students Across All Colleges (stat card)
   - Number of Affiliated Colleges (stat card)
   - University-wide Placement Rate (stat card)
   - College Performance Comparison (table or chart)
   - Skills trends across all departments
   - Placement data aggregated

### Step 5: Verify Different Dashboards (Compare to College Admin)
1. Open college admin in another browser tab/window
2. Compare dashboards side-by-side
3. **Expected Differences:**
   - College Admin: Shows only their college's data
   - University Admin: Shows all colleges' data + comparisons

### Step 6: Test University Admin AI Suggestions
1. **Expected Suggestions:**
   - "Compare placement rates across our colleges"
   - "Which college has the highest placement percentage?"
   - "Show university-wide student statistics"
   - "Analyze skill trends across all departments"

**✅ UNIVERSITY ADMIN ROLE TESTING COMPLETE**

---

## 🧪 TEST SCENARIO 5: SUPER ADMIN ROLE

### Step 1: Login as Super Admin
1. Open: **http://localhost:3000**
2. Click "Super Admin" or "Platform Admin" option
3. Enter credentials:
   - Email: `admin@skillbridge.com`
   - Password: `password123`
4. Click "Login"
5. **Expected:** Platform admin dashboard loads

### Step 2: Verify Super Admin AI Context
1. **Expected Greeting:**
   ```
   "Welcome to SkillBridge Platform Administration! 🛠️ 
   I'm your platform management assistant."
   ```
2. **Expected Assistant Title:** "Your Platform Management Assistant"

### Step 3: Verify Super Admin Navigation
1. **Expected Menu Items:**
   - 📊 Dashboard
   - 👥 Users
   - 🎓 Students
   - 🏭 Companies
   - 🏢 Colleges
   - 🏫 Universities
   - 💼 Jobs
   - 🏢 Campus Drives
   - 📋 Applications
   - 🎓 Placements
   - 📊 Analytics
   - ⚙️ System Settings

### Step 4: View Super Admin Dashboard
1. Click "📊 Dashboard"
2. **Expected to see:**
   - Total Users (by role) - stat card
   - Total Students - stat card
   - Total Companies - stat card
   - Total Universities - stat card
   - Total Job Postings (stat card)
   - Total Placements (stat card)
   - Platform-wide analytics
   - System health metrics

### Step 5: Test Super Admin AI Suggestions
1. **Expected Suggestions:**
   - "How many users are registered on the platform?"
   - "Show active companies and their job postings"
   - "Generate platform-wide placement analytics"
   - "Show total job postings and applications"

### Step 6: Verify Super Admin Has Full Access
1. Try navigating to different sections
2. **Expected:** Can access all user types' data
3. **Expected:** Can view all students, all companies, all colleges

**✅ SUPER ADMIN ROLE TESTING COMPLETE**

---

## 🔒 SECURITY & PRIVACY VERIFICATION

### Privacy Test 1: Hidden CGPA
1. **Setup:**
   - Login as Student → Settings → Uncheck "Show Academic Info"
   - Save settings
   - Logout
2. **Test:**
   - Login as Company
   - Talent Finder → Select job → View candidates
3. **Expected:** Student's CGPA NOT visible for this student

### Privacy Test 2: Private Profile
1. **Setup:**
   - Login as Student → Settings → Set "Profile Visibility" to "Private"
   - Logout
2. **Test:**
   - Login as Company
   - Talent Finder → Search for candidates
3. **Expected:** This student doesn't appear in candidate list

### Privacy Test 3: Recruiter Discovery Disabled
1. **Setup:**
   - Login as Student → Settings → Uncheck "Recruiter Discovery"
   - Logout
2. **Test:**
   - Login as Company
   - Run Talent Finder
3. **Expected:** Student not visible to company

### Authorization Test 1: Student Cannot Access Company Data
1. **Setup:**
   - Login as Student
2. **Test:**
   - Try accessing `/company/dashboard` in URL
3. **Expected:** 401 Unauthorized error

### Authorization Test 2: Company Cannot Access College Admin Data
1. **Setup:**
   - Login as Company
2. **Test:**
   - Try accessing `/college/dashboard` in URL
3. **Expected:** 401 Unauthorized error

---

## 📊 PERFORMANCE VERIFICATION

### Response Time Tests
1. Open DevTools → Network tab
2. Perform actions:
   - Load dashboard
   - Open Talent Finder
   - Save settings
3. **Expected:** All API calls respond in < 500ms

### Page Load Tests
1. Refresh page (Ctrl+R)
2. **Expected:** Page fully loads in < 2 seconds

### Data Rendering Tests
1. Talent Finder with 50+ candidates
2. **Expected:** Smooth scrolling, no lag

---

## ✅ TEST COMPLETION CHECKLIST

### Student Role
- [ ] Login successful
- [ ] AI context loads correctly
- [ ] Navigation shows student menu
- [ ] Dashboard displays correctly
- [ ] Read-only mode works
- [ ] Edit button functions
- [ ] Save/Cancel work
- [ ] Settings page complete
- [ ] Talent Finder shows jobs
- [ ] AI suggestions are student-specific
- [ ] Logout works

### Company Role
- [ ] Login successful
- [ ] AI context loads correctly
- [ ] Navigation shows company menu
- [ ] Dashboard displays ATS pipeline
- [ ] Talent Finder shows candidates
- [ ] Privacy settings respected
- [ ] Settings page complete
- [ ] AI suggestions are recruitment-specific
- [ ] Cannot see restricted student data
- [ ] Logout works

### College Admin Role
- [ ] Login successful
- [ ] AI context loads correctly
- [ ] Navigation shows college admin menu
- [ ] Dashboard displays college stats
- [ ] Does NOT show "My Profile" (student feature)
- [ ] Shows "College Profile" instead
- [ ] Settings page complete
- [ ] AI suggestions are college-specific
- [ ] Logout works

### University Admin Role
- [ ] Login successful
- [ ] AI context loads correctly
- [ ] Navigation shows university admin menu
- [ ] Dashboard shows university-wide data
- [ ] Different from college admin dashboard
- [ ] Settings page complete
- [ ] AI suggestions are university-specific
- [ ] Logout works

### Super Admin Role
- [ ] Login successful
- [ ] AI context loads correctly
- [ ] Navigation shows platform admin menu
- [ ] Dashboard shows platform statistics
- [ ] Can access all user types' data
- [ ] Settings page complete
- [ ] AI suggestions are platform-specific
- [ ] Logout works

### Security & Privacy
- [ ] Students cannot access company data
- [ ] Companies cannot access admin data
- [ ] Hidden CGPA stays hidden
- [ ] Private profiles don't appear in searches
- [ ] Unauthorized requests return 401

### Data Persistence
- [ ] Profile changes persist after refresh
- [ ] Settings persist after logout/login
- [ ] Edit mode saves correctly

**Total Checkboxes:** 80+  
**Target:** All checked ✅

---

## 🆘 TROUBLESHOOTING

### Issue: "Cannot GET /"
- **Solution:** Make sure backend server is running (`node backend/server.js`)

### Issue: Login fails
- **Solution:** Check test account credentials above
- **Solution:** Clear browser cookies/localStorage (F12 → Application → Clear Site Data)

### Issue: API returns 500 error
- **Solution:** Check terminal for backend error messages
- **Solution:** Restart backend server

### Issue: Settings not saving
- **Solution:** Check browser console (F12) for JavaScript errors
- **Solution:** Verify backend is responding with 200 status

### Issue: Talent Finder empty
- **Solution:** Verify jobs exist in database
- **Solution:** Check browser console for fetch errors

---

## 📞 SUPPORT

If you encounter issues:
1. Check browser console (F12 → Console) for errors
2. Check backend terminal output for server errors
3. Review API responses in Network tab (F12 → Network)
4. Verify server is still running

---

**Test Date:** August 29, 2026  
**Test Environment:** Local Development  
**Expected Status:** All tests should PASS ✅
