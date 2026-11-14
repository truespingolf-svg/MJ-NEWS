import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TWO_HOURS_MS,
  getGlobalVoteCooldown,
  getLastVoteTimestamp,
  formatCooldownDuration,
} from './votingCooldown.ts';

test('User with no prior votes can vote immediately', () => {
  const status = getGlobalVoteCooldown({ lastVoteTimestamp: undefined, lastVotedMap: {} }, 1_000_000);
  assert.equal(status.canVote, true);
  assert.equal(status.remainingMs, 0);
  assert.equal(status.nextAvailableAt, null);
});

test('Voting for person A blocks voting for ANY person B within 2 hours', () => {
  const votedAt = 10_000_000;
  const thirtyMinsLater = votedAt + 30 * 60 * 1000;
  const status = getGlobalVoteCooldown({ lastVoteTimestamp: votedAt }, thirtyMinsLater);

  assert.equal(status.canVote, false);
  assert.equal(status.remainingMs, 90 * 60 * 1000);
  assert.equal(status.nextAvailableAt, votedAt + TWO_HOURS_MS);
});

test('Legacy lastVotedMap timestamps enforce global 2-hour cooldown across targets', () => {
  const votedAt = 20_000_000;
  const oneHourLater = votedAt + 60 * 60 * 1000;
  const status = getGlobalVoteCooldown(
    {
      lastVotedMap: {
        'user-a': votedAt - 5 * 60 * 60 * 1000,
        'user-b': votedAt,
      },
    },
    oneHourLater
  );

  assert.equal(getLastVoteTimestamp({ lastVotedMap: { 'user-a': votedAt - 1000, 'user-b': votedAt } }), votedAt);
  assert.equal(status.canVote, false);
  assert.equal(status.remainingMs, 60 * 60 * 1000);
});

test('User can vote again once full 2 hours have elapsed', () => {
  const votedAt = 50_000_000;
  const exactlyTwoHoursLater = votedAt + TWO_HOURS_MS;
  const status = getGlobalVoteCooldown({ lastVoteTimestamp: votedAt }, exactlyTwoHoursLater);

  assert.equal(status.canVote, true);
  assert.equal(status.remainingMs, 0);
  assert.equal(status.nextAvailableAt, null);
});

test('formatCooldownDuration formats hours, minutes, and seconds clearly', () => {
  assert.equal(formatCooldownDuration(2 * 3600 * 1000), '2h 00m 00s');
  assert.equal(formatCooldownDuration(90 * 60 * 1000 + 5000), '1h 30m 05s');
  assert.equal(formatCooldownDuration(12 * 60 * 1000 + 4000), '12m 04s');
  assert.equal(formatCooldownDuration(9500), '10s');
});
