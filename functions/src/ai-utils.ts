/** Shared Gemini response helpers used by Cloud Functions and unit tests. */

export const MODEL_NAME = 'gemini-2.5-flash';

export function stripHtmlFences(raw: string | null | undefined): string {
  return String(raw || '').replace(/```html|```/gi, '').trim();
}

export function sanitizeInspectionJsonText(text: string | null | undefined): string {
  let cleanText = String(text || '').replace(/```json|```/gi, '').trim();
  cleanText = cleanText.replace(/:\s*undefined/g, ': null');
  cleanText = cleanText.replace(/\[\s*undefined\s*\]/g, '[null]');
  cleanText = cleanText.replace(/,\s*undefined\s*,/g, ', null,');
  cleanText = cleanText.replace(/\bundefined\b/g, 'null');
  return cleanText;
}

export async function generateWithRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 800
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number; code?: number | string })?.status
        ?? (error as { code?: number | string })?.code;
      const numeric = typeof status === 'number' ? status : Number(status);
      const isRetryable = numeric === 429 || (Number.isFinite(numeric) && numeric >= 500);
      if (!isRetryable || attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}
