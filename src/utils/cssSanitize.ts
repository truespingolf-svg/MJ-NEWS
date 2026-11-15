const MODERN_COLOR_FN_RE = /\b(oklch|oklab|color-mix|lch|lab|color)\(/gi;

/**
 * Replaces modern CSS color functions (including arbitrarily nested parentheses such as
 * color-mix(in oklab, oklch(...) 50%, transparent)) with safe fallback hex/rgb colors
 * so html2canvas never throws when parsing production Tailwind v4 stylesheets.
 */
export function sanitizeCssModernColors(
  cssText: string,
  fallbackColor: string = '#2b2926'
): string {
  if (!cssText) return '';

  // Strip @property rules that can cause legacy CSS parsers to choke
  let cleaned = cssText.replace(/@property\s+[^{]+\{[^}]*\}/gi, '');

  let out = '';
  let cursor = 0;
  MODERN_COLOR_FN_RE.lastIndex = 0;

  while (cursor < cleaned.length) {
    MODERN_COLOR_FN_RE.lastIndex = cursor;
    const match = MODERN_COLOR_FN_RE.exec(cleaned);
    if (!match) {
      out += cleaned.slice(cursor);
      break;
    }

    const matchStart = match.index;
    const openParenIndex = matchStart + match[0].length - 1;

    out += cleaned.slice(cursor, matchStart);

    // Walk balanced parentheses from openParenIndex
    let depth = 1;
    let i = openParenIndex + 1;
    let quoteChar: string | null = null;

    while (i < cleaned.length && depth > 0) {
      const ch = cleaned[i];
      if (quoteChar) {
        if (ch === '\\') {
          i += 2;
          continue;
        }
        if (ch === quoteChar) {
          quoteChar = null;
        }
      } else {
        if (ch === '"' || ch === "'") {
          quoteChar = ch;
        } else if (ch === '(') {
          depth++;
        } else if (ch === ')') {
          depth--;
        }
      }
      i++;
    }

    const fnName = match[1].toLowerCase();
    const rawExpr = cleaned.slice(matchStart, i);

    // Preserve safe transparent fallback when expression ends with transparent or 0% opacity
    if (fnName === 'color-mix' && /transparent\s*\)\s*$/i.test(rawExpr)) {
      out += 'rgba(43, 41, 38, 0.2)';
    } else if (/\/\s*0(?:\.0+)?\s*\)$/.test(rawExpr)) {
      out += 'transparent';
    } else {
      out += fallbackColor;
    }

    cursor = i;
  }

  return out;
}

export function hasModernCssColors(value: string): boolean {
  if (!value) return false;
  MODERN_COLOR_FN_RE.lastIndex = 0;
  return MODERN_COLOR_FN_RE.test(value);
}
