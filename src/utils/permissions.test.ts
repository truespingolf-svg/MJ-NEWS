import test from 'node:test';
import assert from 'node:assert/strict';
import { getUserPermissions, normalizeRole } from './permissions.ts';

test('normalizeRole trims and uppercases role strings cleanly', () => {
  assert.equal(normalizeRole('  challenge maker '), 'CHALLENGE MAKER');
  assert.equal(normalizeRole(null), '');
  assert.equal(normalizeRole(undefined), '');
});

test('Member has zero staff permissions', () => {
  const perms = getUserPermissions('Member');
  assert.equal(perms.isStaffMember, false);
  assert.equal(perms.isExecutiveStaff, false);
  assert.equal(perms.canModerateEntries, false);
  assert.equal(perms.canAccessNewspaperStudio, false);
  assert.equal(perms.canManageChallenges, false);
  assert.equal(perms.canManageNews, false);
});

test('Deprecated App Moderator maps directly to Member', () => {
  const perms = getUserPermissions('App Moderator');
  assert.equal(perms.badgeLabel, 'Member');
  assert.equal(perms.isStaffMember, false);
  assert.equal(perms.canModerateEntries, false);
});

test('Newspaper Specialist gets Newspaper Studio, publish/mod, and news permissions', () => {
  const perms = getUserPermissions('Newspaper Specialist');
  assert.equal(perms.isStaffMember, true);
  assert.equal(perms.isExecutiveStaff, false);
  assert.equal(perms.canAccessNewspaperStudio, true);
  assert.equal(perms.canPublishNewspaperDirect, true);
  assert.equal(perms.canSendToModeration, true);
  assert.equal(perms.canManageNews, true);
  assert.equal(perms.canModerateEntries, false);
  assert.equal(perms.canManageChallenges, false);
});

test('Challenge Maker gets Challenge Studio & entry moderation permissions', () => {
  const perms = getUserPermissions('Challenge Maker');
  assert.equal(perms.isStaffMember, true);
  assert.equal(perms.isExecutiveStaff, false);
  assert.equal(perms.canManageChallenges, true);
  assert.equal(perms.canModerateEntries, true);
  assert.equal(perms.canAccessNewspaperStudio, false);
});

test('Marketing Executive gets executive & news permissions', () => {
  const perms = getUserPermissions('Marketing Executive');
  assert.equal(perms.isStaffMember, true);
  assert.equal(perms.isExecutiveStaff, true);
  assert.equal(perms.canManageNews, true);
});

test('Administrator and Owner get full executive permissions', () => {
  for (const role of ['Administrator', 'Owner']) {
    const perms = getUserPermissions(role);
    assert.equal(perms.isStaffMember, true);
    assert.equal(perms.isExecutiveStaff, true);
    assert.equal(perms.canModerateEntries, true);
    assert.equal(perms.canAccessNewspaperStudio, true);
    assert.equal(perms.canPublishNewspaperDirect, true);
    assert.equal(perms.canSendToModeration, true);
    assert.equal(perms.canManageChallenges, true);
    assert.equal(perms.canManageNews, true);
  }
});
