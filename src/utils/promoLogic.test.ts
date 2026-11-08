import test from 'node:test';
import assert from 'node:assert/strict';

// Test code matching logic
function matchesPromoCode(
  codeItem: {
    projectId?: string;
    projectTitle?: string;
    pageIndex?: number | string;
  },
  doc: {
    id: string;
    title: string;
  },
  currentPageZeroIndexed: number
): boolean {
  const currentDocId = (doc.id || '').toLowerCase();
  const currentDocTitle = (doc.title || '').toLowerCase().trim();
  const cProj = (codeItem.projectId || 'all').toLowerCase();

  const projMatch =
    cProj === 'all' ||
    cProj === currentDocId ||
    (codeItem.projectTitle && currentDocTitle.includes(codeItem.projectTitle.toLowerCase())) ||
    (currentDocTitle && cProj.includes(currentDocTitle));

  const pageNum = Number(codeItem.pageIndex);
  const targetPage = currentPageZeroIndexed + 1; // 1-indexed
  const pageMatch =
    codeItem.pageIndex === undefined ||
    codeItem.pageIndex === null ||
    codeItem.pageIndex === 'all' ||
    pageNum === 0 ||
    pageNum === targetPage;

  return Boolean(projMatch && pageMatch);
}

// Test duration normalization logic
function normalizeDurationMinutes(input: any): number {
  return Math.max(1, Math.round(Number(input) || 1440));
}

test('promo code matches across all broadsheets on any page', () => {
  const code = { projectId: 'all', pageIndex: 0 };
  const doc = { id: 'project-1', title: 'MJJ Special Edition' };
  assert.equal(matchesPromoCode(code, doc, 0), true);
  assert.equal(matchesPromoCode(code, doc, 2), true);
});

test('promo code matches specific page index', () => {
  const code = { projectId: 'project-1', pageIndex: 2 };
  const doc = { id: 'project-1', title: 'MJJ Special Edition' };
  assert.equal(matchesPromoCode(code, doc, 0), false); // Page 1 (index 0)
  assert.equal(matchesPromoCode(code, doc, 1), true);  // Page 2 (index 1)
});

test('promo code matches title when id is dynamic', () => {
  const code = { projectId: 'all', projectTitle: 'MJJ Special', pageIndex: 1 };
  const doc = { id: 'dynamic-id-99', title: 'MJJ Special Edition' };
  assert.equal(matchesPromoCode(code, doc, 0), true);
});

test('duration normalization handles decimals, zero, and empty strings safely', () => {
  assert.equal(normalizeDurationMinutes('0.5'), 1);
  assert.equal(normalizeDurationMinutes('24'), 24);
  assert.equal(normalizeDurationMinutes(''), 1440);
  assert.equal(normalizeDurationMinutes(null), 1440);
});
