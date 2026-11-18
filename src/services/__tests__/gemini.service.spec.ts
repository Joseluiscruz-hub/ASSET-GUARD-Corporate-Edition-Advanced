import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AIInspectionResponse, Asset } from '../../types';

const callableMock = vi.fn();

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => callableMock),
}));

vi.mock('../../firebase-init', () => ({
  firebaseApp: {},
  functions: { app: {} },
  firebaseReady: true,
}));

vi.mock('../../utils/html-sanitize', () => ({
  sanitizeRawHtml: (html: string | null | undefined) => String(html || ''),
}));

import { GeminiService } from '../gemini.service';

const SAMPLE_ASSET: Asset = {
  id: '35526',
  brand: 'Toyota',
  model: '32-8FG30',
  serial: '92719',
  acquisitionDate: '2024-01-01',
  fuelType: 'GLP/Gasolina Dual',
  status: { id: '1', name: 'Operativo', color: '', hex: '#10b981' },
  statusSince: '2026-01-01T00:00:00Z',
  location: 'Embotellado',
  critical: true,
  cleanlinessStatus: 'Sanitized',
};

describe('GeminiService callable client', () => {
  beforeEach(() => {
    callableMock.mockReset();
  });

  it('calls analyzeMaintenanceHistory and strips residual html fences', async () => {
    callableMock.mockResolvedValue({ data: { html: '```html\n<div>OK</div>\n```' } });
    const service = new GeminiService();
    const html = await service.analyzeMaintenanceHistory(SAMPLE_ASSET, []);
    expect(callableMock).toHaveBeenCalledWith({ asset: SAMPLE_ASSET, history: [] });
    expect(html).toBe('<div>OK</div>');
  });

  it('escapes HTML error payloads returned from callable errors', async () => {
    callableMock.mockRejectedValue(new Error('<script>x</script>API no lista'));
    const service = new GeminiService();
    const html = await service.generateLotoProcedure(SAMPLE_ASSET, 'Fuga hidráulica');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;API no lista');
    expect(html).not.toContain('<script>');
  });

  it('validates structured inspection JSON and falls back cleanly on errors', async () => {
    const validPayload: AIInspectionResponse = {
      inspection: {
        timestamp: '2026-03-01T00:00:00Z',
        asset: {
          component_affected: 'Mástil',
          subcomponent: 'Cadena',
          visual_condition: 'Desgaste leve',
          context_analysis: 'Inspección de planta',
        },
        damage_analysis: {
          damage_type: 'Desgaste',
          visible_signs: ['Fricción'],
          affected_area_percentage: '15%',
          technical_description: 'Lubricación insuficiente',
        },
        severity: {
          level: 'MEDIA',
          risk_score: '45',
          safety_impact: 'Moderado',
          operational_impact: 'Paro preventivo',
          environmental_impact: 'Bajo',
        },
        root_cause_analysis: {
          probable_cause: 'Falta de grasa',
          why_analysis: ['Por qué 1'],
          contributing_factors: ['Polvo'],
        },
        immediate_actions: {
          safety_measures: ['LOTO'],
          containment_actions: ['Lubricar'],
        },
        repair_plan: {
          estimated_parts: [],
          estimated_mttr_hours: '2h',
          estimated_cost_usd: { min: 50, max: 120 },
          recommended_specialists: ['Técnico'],
        },
      },
    };

    callableMock
      .mockResolvedValueOnce({ data: validPayload })
      .mockRejectedValueOnce({ code: 'functions/internal', message: 'Error 502 al comunicarse con el servidor de IA.' });

    const service = new GeminiService();
    const okRes = await service.analyzeImage('abc123', 'image/png');
    expect(okRes.inspection.asset.component_affected).toBe('Mástil');

    const errRes = await service.analyzeImage('abc123', 'image/png');
    expect(errRes.inspection.damage_analysis.damage_type).toBe('Desconocido');
    expect(errRes.inspection.image_quality_warning).toContain('502');
  });

  it('calls getOperatorAdvice and returns trimmed advice', async () => {
    callableMock.mockResolvedValue({ data: { advice: '  Detenga el equipo y coloque conos.  ' } });
    const service = new GeminiService();
    const advice = await service.getOperatorAdvice('Frenos', 'Freno esponjoso');
    expect(callableMock).toHaveBeenCalledWith({ category: 'Frenos', notes: 'Freno esponjoso' });
    expect(advice).toBe('Detenga el equipo y coloque conos.');
  });

  it('calls generateExecutiveReport and returns clean HTML', async () => {
    callableMock.mockResolvedValue({ data: { html: '<h3>KPIs</h3><p>96%</p>' } });
    const service = new GeminiService();
    const html = await service.generateExecutiveReport(
      { availability: 96, mttr: 3.1, totalCostMonth: 8000, budgetMonth: 15000 },
      [],
      { percentage: 96 }
    );
    expect(html).toBe('<h3>KPIs</h3><p>96%</p>');
  });
});
