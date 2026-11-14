import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex, verifyPasscodeAgainstHash } from './passcodeAuth.ts';

test('sha256Hex produces deterministic 64-character hex digest and trims input', async () => {
  const a = await sha256Hex('sample-code');
  const b = await sha256Hex('  sample-code  ');
  assert.equal(a, b);
  assert.equal(a.length, 64);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test('verifyPasscodeAgainstHash validates matching and non-matching candidates accurately', async () => {
  const storedHash = await sha256Hex('9876');
  assert.equal(await verifyPasscodeAgainstHash('9876', storedHash), true);
  assert.equal(await verifyPasscodeAgainstHash(' 9876 ', storedHash), true);
  assert.equal(await verifyPasscodeAgainstHash('9875', storedHash), false);
  assert.equal(await verifyPasscodeAgainstHash('', storedHash), false);
  assert.equal(await verifyPasscodeAgainstHash('9876', null), false);
});
