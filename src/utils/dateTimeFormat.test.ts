import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLocalDateTimeParts,
  buildLocalDateTimeString,
  applyQuickSchedulePreset,
  formatTargetCountdownSummary,
} from './dateTimeFormat';

test('parseLocalDateTimeParts converts 24h ISO string to 12h AM/PM parts accurately', () => {
  const pm = parseLocalDateTimeParts('2026-11-20T20:05');
  assert.deepEqual(pm, {
    year: 2026,
    month: 11,
    day: 20,
    hour12: 8,
    minute: 5,
    meridiem: 'PM',
  });

  const midnight = parseLocalDateTimeParts('2026-11-20T00:30');
  assert.equal(midnight.hour12, 12);
  assert.equal(midnight.meridiem, 'AM');

  const noon = parseLocalDateTimeParts('2026-11-20T12:00');
  assert.equal(noon.hour12, 12);
  assert.equal(noon.meridiem, 'PM');
});

test('buildLocalDateTimeString clamps short-month days and formats 24h ISO string cleanly', () => {
  const built = buildLocalDateTimeString({
    year: 2026,
    month: 2,
    day: 31, // Feb 2026 only has 28 days
    hour12: 9,
    minute: 15,
    meridiem: 'PM',
  });
  assert.equal(built, '2026-02-28T21:15');

  const noonBuilt = buildLocalDateTimeString({
    year: 2026,
    month: 11,
    day: 5,
    hour12: 12,
    minute: 0,
    meridiem: 'AM',
  });
  assert.equal(noonBuilt, '2026-11-05T00:00');
});

test('applyQuickSchedulePreset advances accurately for relative presets', () => {
  const base = new Date(2026, 10, 15, 10, 0, 0).getTime(); // Nov 15, 2026 10:00 AM local
  assert.equal(applyQuickSchedulePreset('in-15m', base), '2026-11-15T10:15');
  assert.equal(applyQuickSchedulePreset('in-1h', base), '2026-11-15T11:00');
  assert.equal(applyQuickSchedulePreset('tonight-8pm', base), '2026-11-15T20:00');
  assert.equal(applyQuickSchedulePreset('tomorrow-8pm', base), '2026-11-16T20:00');
});

test('formatTargetCountdownSummary reports future durations and immediate live state clearly', () => {
  const now = new Date(2026, 10, 15, 10, 0, 0).getTime();
  const future = formatTargetCountdownSummary('2026-11-17T12:30', now);
  assert.equal(future.isPast, false);
  assert.equal(future.relative, 'Starts in 2d 2h 30m');

  const past = formatTargetCountdownSummary('2026-11-15T09:00', now);
  assert.equal(past.isPast, true);
  assert.equal(past.relative, 'Broadcasting LIVE immediately');
});
