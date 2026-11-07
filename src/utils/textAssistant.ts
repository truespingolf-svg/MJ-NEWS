import { GoogleGenAI } from '@google/genai';

export type TextAssistanceMode =
  | 'make-exclusive'
  | 'formal-executive'
  | 'concise-impact'
  | 'polish-grammar';

/**
 * Intelligent local rule-based enhancement presets that run instantaneously
 */
export function enhanceTextLocally(text: string, mode: TextAssistanceMode): string {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();

  switch (mode) {
    case 'make-exclusive': {
      let result = trimmed
        .replace(/\bplease come\b/gi, 'you are cordially requested to grace our presence')
        .replace(/\bjoin us\b/gi, 'request the honor of your distinguished presence')
        .replace(/\bparty\b/gi, 'private celebratory gala')
        .replace(/\bevent\b/gi, 'exclusive private soiree')
        .replace(/\bticket\b/gi, 'all-access VIP credential')
        .replace(/\bguest\b/gi, 'distinguished patron')
        .replace(/\bgood\b/gi, 'exemplary')
        .replace(/\bfun\b/gi, 'extraordinary and memorable');

      if (!result.toLowerCase().includes('honored') && !result.toLowerCase().includes('cordially')) {
        result = `By official distinction, you are cordially invited to ${result}. Admittance strictly reserved for distinguished passholders.`;
      }
      return result;
    }

    case 'formal-executive': {
      let result = trimmed
        .replace(/\bwe are happy to\b/gi, 'we are pleased to formally confirm')
        .replace(/\byou got the job\b/gi, 'your appointment has been formally ratified')
        .replace(/\byou are fired\b/gi, 'your employment is hereby formally concluded')
        .replace(/\bwe will pay you\b/gi, 'the executive compensation package comprises')
        .replace(/\bstart date\b/gi, 'effective commencement date')
        .replace(/\bboss\b/gi, 'reporting director')
        .replace(/\brules\b/gi, 'statutory governance policies');

      if (!result.endsWith('.')) result += '.';
      return result;
    }

    case 'concise-impact': {
      const sentences = trimmed.split(/(?<=[.?!])\s+/);
      const tightened = sentences.map((s) =>
        s
          .replace(/\bin order to\b/gi, 'to')
          .replace(/\bdue to the fact that\b/gi, 'because')
          .replace(/\bat this point in time\b/gi, 'currently')
          .replace(/\bplease be advised that\b/gi, '')
          .replace(/\bit is important to note that\b/gi, '')
          .trim()
      );
      return tightened.join(' ');
    }

    case 'polish-grammar': {
      // Capitalize first letter of sentences and ensure clean punctuation
      let cleaned = trimmed
        .replace(/\s+/g, ' ')
        .replace(/([.?!]\s*)([a-z])/g, (_match, sep, char) => sep + char.toUpperCase());

      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      if (!/[.!?]$/.test(cleaned)) {
        cleaned += '.';
      }
      return cleaned;
    }

    default:
      return trimmed;
  }
}

/**
 * AI-assisted text rewrite with Gemini fallback to local enhancer
 */
export async function enhanceTextWithAi(
  text: string,
  mode: TextAssistanceMode
): Promise<string> {
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Run instant rule-based enhancer
    return enhanceTextLocally(text, mode);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    let promptInstruction = '';

    if (mode === 'make-exclusive') {
      promptInstruction =
        'Rewrite this invitation/event copy to sound extraordinarily prestigious, exclusive, elegant, and VIP for luxury event patrons. Keep it concise.';
    } else if (mode === 'formal-executive') {
      promptInstruction =
        'Rewrite this text with impeccable executive legal/HR corporate precision, formal phrasing, and professional dignity.';
    } else if (mode === 'concise-impact') {
      promptInstruction =
        'Rewrite this text to be punchy, clear, and high-impact, removing all filler words.';
    } else {
      promptInstruction =
        'Polish the grammar, syntax, punctuation, and flow of this text while preserving its core intent.';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${promptInstruction}\n\nOriginal text:\n"""${text}"""\n\nReturn only the revised text without commentary or quotation marks.`,
    });

    const output = response.text?.trim();
    return output || enhanceTextLocally(text, mode);
  } catch (err) {
    console.warn('Gemini enhancement failed, falling back to local enhancer:', err);
    return enhanceTextLocally(text, mode);
  }
}
