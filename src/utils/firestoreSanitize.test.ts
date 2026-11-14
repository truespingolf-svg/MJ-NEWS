import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeForFirestore, estimateJsonBytes } from './firestoreSanitize.ts';

test('sanitizeForFirestore removes nested undefined keys while preserving valid values and dates', () => {
  const input = {
    title: 'Special Issue',
    subtitle: undefined,
    createdAt: new Date('2026-01-15T00:00:00.000Z'),
    nested: {
      keep: 42,
      drop: undefined,
      arr: [1, undefined, { a: 'ok', b: undefined }],
    },
  };

  const sanitized = sanitizeForFirestore(input) as any;
  assert.equal('subtitle' in sanitized, false);
  assert.equal(sanitized.title, 'Special Issue');
  assert.equal(sanitized.createdAt, '2026-01-15T00:00:00.000Z');
  assert.equal('drop' in sanitized.nested, false);
  assert.equal(sanitized.nested.keep, 42);
  assert.equal(sanitized.nested.arr[0], 1);
  assert.equal(sanitized.nested.arr[1], null);
  assert.equal('b' in sanitized.nested.arr[2], false);
  assert.equal(sanitized.nested.arr[2].a, 'ok');
});

test('estimateJsonBytes returns accurate UTF-8 byte count', () => {
  const bytes = estimateJsonBytes({ hello: 'world' });
  assert.equal(bytes, Buffer.byteLength(JSON.stringify({ hello: 'world' }), 'utf8'));
});
