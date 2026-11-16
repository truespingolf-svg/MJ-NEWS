import test from 'node:test';
import assert from 'node:assert/strict';
import { computeObjectFitRect, computePdfPageSizeMm } from './pdfGeometry';

test('computeObjectFitRect preserves aspect ratio under cover mode for wide images', () => {
  // 1600x900 photo inside a 400x300 container
  const rect = computeObjectFitRect(1600, 900, 400, 300, 'cover');
  assert.equal(rect.height, 300);
  assert.ok(Math.abs(rect.width - 533.33) < 0.05);
  assert.ok(Math.abs(rect.width / rect.height - 16 / 9) < 0.01);
});

test('computeObjectFitRect preserves aspect ratio under cover mode for tall portrait images', () => {
  // 600x1200 portrait photo inside a 400x200 container
  const rect = computeObjectFitRect(600, 1200, 400, 200, 'cover');
  assert.equal(rect.width, 400);
  assert.equal(rect.height, 800);
  assert.ok(Math.abs(rect.width / rect.height - 0.5) < 0.001);
});

test('computeObjectFitRect preserves aspect ratio under contain mode', () => {
  const rect = computeObjectFitRect(1000, 500, 400, 400, 'contain');
  assert.equal(rect.width, 400);
  assert.equal(rect.height, 200);
});

test('computePdfPageSizeMm preserves exact broadsheet pixel aspect ratio with zero stretch', () => {
  // Standard 800x1050 broadsheet page
  const page1 = computePdfPageSizeMm(800, 1050, 210);
  assert.equal(page1.widthMm, 210);
  assert.equal(page1.heightMm, 275.63);
  assert.equal(page1.orientation, 'portrait');

  // Taller multi-story broadsheet page (e.g. 800x1320)
  const tallPage = computePdfPageSizeMm(800, 1320, 210);
  assert.equal(tallPage.widthMm, 210);
  assert.equal(tallPage.heightMm, 346.5);
  assert.equal(tallPage.orientation, 'portrait');
});
