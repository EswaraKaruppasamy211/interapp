# Cross-Company Recommendation Feature - Quick Start Guide

## What is it?

When a recruiter shortlists a student, the SkillBridge platform automatically identifies other companies with open positions that match the student's profile. The student is then notified of these opportunities and can choose to opt-in or exclude specific companies.

## For Students

### Enabling/Disabling Cross-Company Recommendations

1. **Navigate to Settings**
   - Click your profile → Settings
   - Look for "Recommend my profile to other companies when shortlisted"

2. **Toggle the Feature**
   - ✅ **ON** = Your profile will be shared with other companies when you're shortlisted
   - ❌ **OFF** = Cross-company recommendations disabled

3. **Exclude Specific Companies**
   - Add company names or IDs to the exclusion list
   - These companies will never see your profile, even if you're shortlisted elsewhere

### Viewing Your Recommendations

```
GET /api/student/cross-recommendations
```

**Response**:
```json
{
  "recommendations": [
    {
      "id": "xrec-...",
      "target_job_id": 102,
      "target_company_id": "CMP-10002",
      "score": 57,
      "status": "pending",
      "created_at": "2026-08-29T15:09:00.236Z"
    }
  ]
}
```

### Notifications

You'll receive a notification whenever:
- Your profile is recommended to new companies
- A company reviews your cross-recommendation
- A company invites you based on a cross-recommendation

---

## For Recruiters

### How It Works

1. You interview candidates through normal ATS pipeline
2. When you move a candidate to "Shortlisted" (or later stages), the system automatically scans for matching opportunities at other companies
3. The candidate receives a notification that they've been recommended elsewhere

### Viewing Incoming Cross-Recommendations

```
GET /api/company/cross-recommendations
```

**Response** (only shows recommendations for your company):
```json
{
  "recommendations": [
    {
      "id": "xrec-...",
      "student_id": 1,
      "target_job_id": 102,
      "score": 57,
      "status": "pending",
      "created_at": "2026-08-29T15:09:00.236Z"
    }
  ]
}
```

### Updating Recommendation Status

```
PUT /api/company/cross-recommendations/{id}/status
Body: { "status": "reviewed" | "invited" | "dismissed" }
```

### Important Privacy Notes

- ⚠️ You **cannot see** which company originally recommended the candidate
- ⚠️ You **cannot identify** the source company or job
- ✅ This preserves confidentiality and prevents recruitment wars
- ✅ The recommendation is based purely on skills/qualification match

---

## For Platform Administrators

### Configuration

#### Job-Level Settings

Each job defines who gets recommended:

```javascript
{
  id: 102,
  title: 'AI Product Engineer',
  min_cgpa: 7.5,
  min_ai_score: 50,  // Only recommend students with 50%+ match
  status: 'Open'      // Only open jobs receive recommendations
}
```

#### Student-Level Settings

Settings API response:

```json
{
  "crossRecommendEnabled": true,
  "excludedCompanyIds": ["CMP-10001", "CMP-10003"]
}
```

### API Endpoints Reference

#### Student Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/student/cross-recommendations` | List recommendations for this student |
| GET | `/api/student/settings` | Read recommendation preferences |
| PUT | `/api/student/settings` | Update preferences |

#### Company Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/company/cross-recommendations` | List incoming recommendations |
| PUT | `/api/company/cross-recommendations/{id}/status` | Update recommendation status |

#### Admin Endpoints (Backend Only)

| Trigger | Handler | Function |
|---------|---------|----------|
| ATS Stage Update to "Shortlisted" | `/api/company/applications/{id}/stage` | Fires `triggerCrossRecommendations()` |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  RECRUITER ACTIONS                          │
│                   (Company A)                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ (Moves Student to "Shortlisted")
          ┌──────────────────────────┐
          │  ATS Stage Update Event  │
          └──────────────┬───────────┘
                         │
                         ▼
          ┌──────────────────────────────────────┐
          │  Trigger Cross-Recommendation Engine │
          │  (Only if consent enabled)           │
          └──────────────┬───────────────────────┘
                         │
         ┌───────────────┼───────────────────┐
         │               │                   │
         ▼               ▼                   ▼
    ┌────────┐    ┌────────┐          ┌────────┐
    │ Job B  │    │ Job C  │    ...   │ Job N  │
    │ (Open) │    │ (Open) │          │ (Open) │
    └────┬───┘    └────┬───┘          └────┬───┘
         │              │                   │
         ▼              ▼                   ▼
    ┌──────────────────────────────────────────────┐
    │  Match Calculation (using Talent Finder)     │
    │  Score: Match % vs min_ai_score              │
    └──────────────┬───────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
         ▼ (Pass)             ▼ (Fail)
    ┌─────────┐          ┌──────────┐
    │QUALIFY  │          │  FILTER  │
    │Candidate│          │   OUT    │
    └────┬────┘          └──────────┘
         │
         ▼
    ┌────────────────────────────────┐
    │ Create Recommendation Record   │
    │ (Source company NOT exposed)   │
    └────────────┬───────────────────┘
                 │
    ┌────────────┴──────────┐
    │                       │
    ▼                       ▼
┌─────────────────┐  ┌──────────────────┐
│ Student         │  │ Target Company   │
│ Notification    │  │ Notification     │
│ "Profile        │  │ "Strong match    │
│  recommended"   │  │  for your job"   │
└─────────────────┘  └──────────────────┘
    │                       │
    ▼                       ▼
┌──────────────────────────────────────┐
│ Student sees new cross-recommendation│
│ Target company invites candidate     │
│ Both benefit without source leak     │
└──────────────────────────────────────┘
```

---

## Key Privacy Guarantees

1. **No Source Leak**: Target companies don't know which company recommended the student
2. **Student Control**: Students can disable or exclude companies anytime
3. **Negative Signals**: Companies where students withdrew/rejected are excluded
4. **Score Thresholding**: Only well-matched candidates are recommended
5. **Audit Trail**: All recommendations logged with timestamp and status

---

## Common Scenarios

### Scenario 1: Student Gets Shortlisted
```
1. Recruiter at TechCorp moves student to "Shortlisted"
2. System scans all other companies' open jobs
3. Finds 2 matching positions at DataSoft Systems and InnovateTech
4. Creates recommendation records
5. Student gets notification: "Your profile recommended to 2 companies"
6. Student can view details via /api/student/cross-recommendations
```

### Scenario 2: Student Opts Out
```
1. Student disables "crossRecommendEnabled" in settings
2. Future shortlists DO NOT trigger recommendations
3. Existing recommendations remain (student can still view them)
4. To exclude specific companies: add to "excludedCompanyIds"
```

### Scenario 3: Student Already Rejected Company
```
1. Student was previously rejected by Company A
2. Gets shortlisted at Company B
3. System checks all open jobs from Company A
4. **Does NOT recommend** if student already rejected applications exist
5. This prevents spamming after rejection
```

---

## Troubleshooting

### No recommendations generated?
- ✅ Check if student consent is enabled: `GET /api/student/settings`
- ✅ Verify target jobs are "Open" status
- ✅ Check if match score meets `min_ai_score` threshold
- ✅ Ensure student not already rejected from target company

### Notifications not appearing?
- ✅ Check notification preferences in settings
- ✅ Verify API endpoint: `GET /api/student/notifications`
- ✅ Check browser notification permissions

### Can't see incoming recommendations?
- ✅ Company users may need to be seeded
- ✅ Check if logged in as company role
- ✅ Verify company ID matches recommendation target

---

## Technical Implementation Summary

**Core Algorithm** (buildCrossRecommendationRecords):
```
IF student.crossRecommendEnabled == false:
  RETURN []

FOR each job in state.jobs:
  IF job.companyId == source_company_id:
    SKIP (don't recommend back to same company)
  
  IF job.companyId in student.excludedCompanyIds:
    SKIP (student excluded this company)
  
  IF exists application(student, company) where status in [Rejected, Withdrawn]:
    SKIP (student already rejected from this company)
  
  IF job.status != 'Open':
    SKIP (job not available)
  
  match_score = calculateStudentJobMatch(student, job)
  
  IF match_score >= job.min_ai_score:
    CREATE recommendation record
    ADD notification to student and target company

RETURN recommendations
```

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-08-29
