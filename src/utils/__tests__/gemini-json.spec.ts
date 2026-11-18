import { describe, it, expect } from 'vitest';
import { sanitizeInspectionJsonText } from '../../../functions/src/ai-utils';
import { mapAuthErrorToSpanishMX } from '../../services/auth.service';

describe('AI JSON Sanitization & Auth Error Mapping', () => {
  it('cleans markdown json fences and undefined literals from Gemini responses', () => {
    const raw = '```json\n{"a": undefined, "b": [undefined, 1], "c": "ok"}\n```';
    const cleaned = sanitizeInspectionJsonText(raw);
    const parsed = JSON.parse(cleaned) as { a: null; b: Array<null | number>; c: string };
    expect(parsed.a).toBeNull();
    expect(parsed.b).toEqual([null, 1]);
    expect(parsed.c).toBe('ok');
  });

  it('maps Firebase auth error codes to localized Mexican Spanish messages', () => {
    expect(mapAuthErrorToSpanishMX({ code: 'auth/wrong-password' })).toContain('incorrectos');
    expect(mapAuthErrorToSpanishMX({ code: 'auth/invalid-email' })).toContain('formato');
    expect(mapAuthErrorToSpanishMX({ code: 'auth/operation-not-allowed' })).toContain('Firebase');
  });
});
