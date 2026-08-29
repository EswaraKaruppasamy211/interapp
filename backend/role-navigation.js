// SkillBridge Role-Based Navigation Configuration
// Defines navigation menus for each role

const ROLE_NAVIGATION = {
  student: {
    label: 'Student',
    menuItems: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home', group: 'main' },
      { id: 'profile', label: 'My Profile', icon: 'user', group: 'main' },
      { id: 'academics', label: 'Academics', icon: 'graduation-cap', group: 'academic' },
      { id: 'skills', label: 'Skills', icon: 'star', group: 'academic' },
      { id: 'certificates', label: 'Certificates', icon: 'award', group: 'portfolio' },
      { id: 'portfolio', label: 'Projects', icon: 'briefcase', group: 'portfolio' },
      { id: 'talent-finder', label: 'Talent Finder', icon: 'search', group: 'opportunities' },
      { id: 'campus-drives', label: 'Campus Drives', icon: 'calendar', group: 'opportunities' },
      { id: 'applications', label: 'Applications', icon: 'file-text', group: 'opportunities' },
      { id: 'placement', label: 'Placement', icon: 'check-circle', group: 'opportunities' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', group: 'other' },
      { id: 'settings', label: 'Settings', icon: 'settings', group: 'other' }
    ]
  },

  company: {
    label: 'Company',
    menuItems: [
      { id: 'company-dashboard', label: 'Dashboard', icon: 'home', group: 'main' },
      { id: 'company-profile', label: 'Company Profile', icon: 'building', group: 'main' },
      { id: 'jobs', label: 'Job Posts', icon: 'briefcase', group: 'recruitment' },
      { id: 'create-job', label: 'Create Job', icon: 'plus-circle', group: 'recruitment' },
      { id: 'applications', label: 'Applications', icon: 'inbox', group: 'recruitment' },
      { id: 'talent-finder', label: 'Talent Finder', icon: 'search', group: 'recruitment' },
      { id: 'shortlisted', label: 'Shortlisted', icon: 'star', group: 'recruitment' },
      { id: 'campus-drives', label: 'Campus Drives', icon: 'calendar', group: 'recruitment' },
      { id: 'interviews', label: 'Interviews', icon: 'mic', group: 'recruitment' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', group: 'other' },
      { id: 'settings', label: 'Settings', icon: 'settings', group: 'other' }
    ]
  },

  college_admin: {
    label: 'College Admin',
    menuItems: [
      { id: 'college-dashboard', label: 'Dashboard', icon: 'home', group: 'main' },
      { id: 'college-profile', label: 'College Profile', icon: 'building', group: 'main' },
      { id: 'students', label: 'Students', icon: 'users', group: 'management' },
      { id: 'academics', label: 'Academic Analytics', icon: 'chart-bar', group: 'analytics' },
      { id: 'skills', label: 'Skills Analysis', icon: 'trending-up', group: 'analytics' },
      { id: 'placements', label: 'Placements', icon: 'briefcase', group: 'analytics' },
      { id: 'companies', label: 'Companies', icon: 'building', group: 'management' },
      { id: 'campus-drives', label: 'Campus Drives', icon: 'calendar', group: 'management' },
      { id: 'reports', label: 'Reports', icon: 'file-text', group: 'analytics' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', group: 'other' },
      { id: 'settings', label: 'Settings', icon: 'settings', group: 'other' }
    ]
  },

  university_admin: {
    label: 'University Admin',
    menuItems: [
      { id: 'university-dashboard', label: 'Dashboard', icon: 'home', group: 'main' },
      { id: 'university-profile', label: 'University Profile', icon: 'building', group: 'main' },
      { id: 'colleges', label: 'Colleges', icon: 'grid', group: 'management' },
      { id: 'students', label: 'Students', icon: 'users', group: 'management' },
      { id: 'academics', label: 'Academic Analytics', icon: 'chart-bar', group: 'analytics' },
      { id: 'placements', label: 'Placement Analytics', icon: 'trending-up', group: 'analytics' },
      { id: 'companies', label: 'Companies', icon: 'building', group: 'management' },
      { id: 'campus-drives', label: 'Campus Drives', icon: 'calendar', group: 'management' },
      { id: 'reports', label: 'Reports', icon: 'file-text', group: 'analytics' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', group: 'other' },
      { id: 'settings', label: 'Settings', icon: 'settings', group: 'other' }
    ]
  },

  super_admin: {
    label: 'Platform Admin',
    menuItems: [
      { id: 'admin-dashboard', label: 'Dashboard', icon: 'home', group: 'main' },
      { id: 'users', label: 'Users', icon: 'users', group: 'management' },
      { id: 'students', label: 'Students', icon: 'graduation-cap', group: 'management' },
      { id: 'companies', label: 'Companies', icon: 'building', group: 'management' },
      { id: 'colleges', label: 'Colleges', icon: 'grid', group: 'management' },
      { id: 'universities', label: 'Universities', icon: 'globe', group: 'management' },
      { id: 'jobs', label: 'Job Postings', icon: 'briefcase', group: 'content' },
      { id: 'campus-drives', label: 'Campus Drives', icon: 'calendar', group: 'content' },
      { id: 'applications', label: 'Applications', icon: 'inbox', group: 'content' },
      { id: 'placements', label: 'Placements', icon: 'check-circle', group: 'analytics' },
      { id: 'analytics', label: 'Analytics', icon: 'chart-bar', group: 'analytics' },
      { id: 'system-settings', label: 'System Settings', icon: 'settings', group: 'system' }
    ]
  }
};

/**
 * Get navigation for a specific role
 */
function getNavigationByRole(role) {
  return ROLE_NAVIGATION[role?.toLowerCase()] || ROLE_NAVIGATION.student;
}

/**
 * Get grouped navigation items for a role
 */
function getGroupedNavigationByRole(role) {
  const nav = getNavigationByRole(role);
  const groups = {};
  
  nav.menuItems.forEach(item => {
    if (!groups[item.group]) {
      groups[item.group] = [];
    }
    groups[item.group].push(item);
  });

  return { role: nav.label, groups };
}

/**
 * Navigation group labels (for UI display)
 */
const NAVIGATION_GROUP_LABELS = {
  main: 'Main',
  academic: 'Academic',
  portfolio: 'Portfolio',
  opportunities: 'Opportunities',
  recruitment: 'Recruitment',
  management: 'Management',
  analytics: 'Analytics',
  content: 'Content Management',
  system: 'System',
  other: 'Other'
};

module.exports = {
  ROLE_NAVIGATION,
  NAVIGATION_GROUP_LABELS,
  getNavigationByRole,
  getGroupedNavigationByRole
};
