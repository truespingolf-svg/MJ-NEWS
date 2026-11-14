export interface UserPermissions {
  rawRole: string;
  normalizedRole: string;
  badgeLabel: string;
  isStaffMember: boolean;
  isExecutiveStaff: boolean;
  canModerateEntries: boolean;
  canAccessNewspaperStudio: boolean;
  canPublishNewspaperDirect: boolean;
  canSendToModeration: boolean;
  canManageChallenges: boolean;
  canManageNews: boolean;
}

/**
 * Normalizes a role string for reliable matching regardless of casing/spacing.
 */
export function normalizeRole(role?: string | null): string {
  return (role || '').trim().toUpperCase();
}

/**
 * Derives concrete application permissions from a user's assigned role.
 */
export function getUserPermissions(role?: string | null): UserPermissions {
  const rawRole = (role || '').trim();
  const normalizedRole = normalizeRole(rawRole);

  if (normalizedRole === 'APP MODERATOR' || normalizedRole === 'MODERATOR' || normalizedRole === 'MOD') {
    return {
      rawRole: 'Member',
      normalizedRole: 'MEMBER',
      badgeLabel: 'Member',
      isStaffMember: false,
      isExecutiveStaff: false,
      canModerateEntries: false,
      canAccessNewspaperStudio: false,
      canPublishNewspaperDirect: false,
      canSendToModeration: false,
      canManageChallenges: false,
      canManageNews: false,
    };
  }

  const isExecutiveStaff =
    normalizedRole === 'OWNER' ||
    normalizedRole === 'ADMINISTRATOR' ||
    normalizedRole === 'ADMIN' ||
    normalizedRole === 'STAFF' ||
    normalizedRole.includes('EXECUTIVE');

  const isNewspaperSpecialist =
    normalizedRole === 'NEWSPAPER SPECIALIST' ||
    normalizedRole === 'BROADSHEET CONTRIBUTOR' ||
    normalizedRole === 'EDITOR' ||
    normalizedRole.includes('NEWSPAPER') ||
    normalizedRole.includes('BROADSHEET');

  const isChallengeMaker =
    normalizedRole === 'CHALLENGE MAKER' ||
    normalizedRole === 'CHALLENGE MANAGER' ||
    normalizedRole.includes('CHALLENGE');

  const isMarketingLead =
    normalizedRole === 'MARKETING EXECUTIVE' ||
    normalizedRole === 'MARKETING LEAD';

  const canModerateEntries = isExecutiveStaff || isChallengeMaker;
  const canAccessNewspaperStudio = isExecutiveStaff || isNewspaperSpecialist;
  const canPublishNewspaperDirect = isExecutiveStaff || isNewspaperSpecialist;
  const canSendToModeration = isExecutiveStaff || isNewspaperSpecialist;
  const canManageChallenges = isExecutiveStaff || isChallengeMaker;
  const canManageNews = isExecutiveStaff || isNewspaperSpecialist || isMarketingLead;

  const isStaffMember =
    isExecutiveStaff ||
    isNewspaperSpecialist ||
    isChallengeMaker ||
    isMarketingLead;

  return {
    rawRole,
    normalizedRole,
    badgeLabel: rawRole || (isStaffMember ? 'Staff' : 'Member'),
    isStaffMember,
    isExecutiveStaff,
    canModerateEntries,
    canAccessNewspaperStudio,
    canPublishNewspaperDirect,
    canSendToModeration,
    canManageChallenges,
    canManageNews,
  };
}
