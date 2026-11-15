import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCssModernColors, hasModernCssColors } from './cssSanitize.ts';

describe('cssSanitize', () => {
  it('replaces nested oklch and color-mix functions cleanly', () => {
    const css = `.bg-red-500\\/20 { background-color: color-mix(in oklab, oklch(0.637 0.237 25.331) 20%, transparent); border-color: oklch(0.7 0.1 80 / 0.5); }`;
    const result = sanitizeCssModernColors(css, '#2b2926');

    assert.equal(hasModernCssColors(result), false);
    assert.ok(result.includes('.bg-red-500\\/20'));
    assert.ok(result.includes('background-color: rgba(43, 41, 38, 0.2);'));
    assert.ok(result.includes('border-color: #2b2926;'));
  });

  it('strips @property blocks while preserving standard rules', () => {
    const css = `
      @property --tw-ring-color { syntax: "*"; inherits: false; }
      .newsprint-paper { background-color: #faf7f0; color: #1a1918; }
      :root { --amber: oklab(0.8 0.1 0.1); }
    `;
    const result = sanitizeCssModernColors(css);
    assert.equal(hasModernCssColors(result), false);
    assert.ok(!result.includes('@property'));
    assert.ok(result.includes('background-color: #faf7f0; color: #1a1918;'));
  });

  it('handles zero-alpha oklch as transparent', () => {
    const css = `.fade { color: oklch(0.5 0.1 20 / 0); }`;
    const result = sanitizeCssModernColors(css);
    assert.ok(result.includes('color: transparent;'));
  });
});
