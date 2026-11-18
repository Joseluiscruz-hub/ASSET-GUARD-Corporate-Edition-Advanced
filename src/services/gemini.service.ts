import { Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import { FailureReport, Asset, KPIData, AIInspectionResponse, ForkliftFailureEntry } from '../types';
import { functions as firebaseFunctions, firebaseReady } from '../firebase-init';
import { sanitizeRawHtml } from '../utils/html-sanitize';

interface HtmlApiResponse {
  html?: string;
}

interface AdviceApiResponse {
  advice?: string;
}

const CALLABLE_TIMEOUT_MS = 60000;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeHtmlResponse(rawHtml: string | undefined, fallbackHtml: string): string {
  if (!rawHtml || !rawHtml.trim()) {
    return fallbackHtml;
  }
  const stripped = rawHtml.replace(/```html|```/gi, '').trim();
  const sanitized = sanitizeRawHtml(stripped).trim();
  return sanitized || fallbackHtml;
}

function errorMessage(error: unknown, fallback: string): string {
  const err = error as { message?: string; code?: string };
  if (err?.code === 'functions/unauthenticated') {
    return 'Debes iniciar sesión para usar el servicio de IA.';
  }
  if (err?.code === 'functions/failed-precondition') {
    return 'El servicio de IA no está configurado en Functions (falta GEMINI_API_KEY).';
  }
  if (err?.code === 'functions/unavailable' || err?.code === 'functions/not-found') {
    return 'El servicio de IA no está desplegado todavía. Cuando configures el secreto y hagas deploy de Functions, esta función se activará.';
  }
  return err?.message || fallback;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  private async callFunction<TReq, TRes>(name: string, data: TReq): Promise<TRes> {
    if (!firebaseReady) {
      throw new Error('Firebase Functions no está inicializado en este entorno.');
    }
    const callable = httpsCallable<TReq, TRes>(firebaseFunctions, name, { timeout: CALLABLE_TIMEOUT_MS });
    const result = await callable(data);
    return result.data;
  }

  private createFallbackInspectionResponse(visualCondition: string, observation: string): AIInspectionResponse {
    return {
      inspection: {
        timestamp: new Date().toISOString(),
        asset: {
          component_affected: 'Desconocido',
          subcomponent: '',
          visual_condition: visualCondition,
          context_analysis: ''
        },
        damage_analysis: {
          damage_type: 'Desconocido',
          visible_signs: [],
          affected_area_percentage: '0%',
          technical_description: ''
        },
        severity: {
          level: 'BAJA',
          risk_score: '0',
          safety_impact: 'No determinado',
          operational_impact: 'No determinado',
          environmental_impact: 'No determinado'
        },
        root_cause_analysis: {
          probable_cause: 'No determinada',
          why_analysis: [],
          contributing_factors: []
        },
        immediate_actions: {
          safety_measures: [],
          containment_actions: []
        },
        repair_plan: {
          estimated_parts: [],
          estimated_mttr_hours: '0',
          estimated_cost_usd: { min: 0, max: 0 },
          recommended_specialists: []
        },
        image_quality_warning: observation
      }
    };
  }

  async analyzeMaintenanceHistory(asset: Asset, history: FailureReport[]): Promise<string> {
    try {
      const data = await this.callFunction<{ asset: Asset; history: FailureReport[] }, HtmlApiResponse>(
        'analyzeMaintenanceHistory',
        { asset, history }
      );
      return normalizeHtmlResponse(
        data.html,
        '<p>Datos insuficientes para predicción.</p>'
      );
    } catch (error) {
      const msg = errorMessage(error, 'Error conectando con el servicio de IA.');
      console.warn('Gemini Error (Predictivo):', msg);
      return `<p class="text-red-500">${escapeHtml(msg)}</p>`;
    }
  }

  async generateExecutiveReport(
    kpi: KPIData,
    activeFailures: Pick<ForkliftFailureEntry, 'economico' | 'falla'>[],
    availability: { percentage: number }
  ): Promise<string> {
    try {
      const data = await this.callFunction<
        { kpi: KPIData; activeFailures: Pick<ForkliftFailureEntry, 'economico' | 'falla'>[]; availability: { percentage: number } },
        HtmlApiResponse
      >('generateExecutiveReport', { kpi, activeFailures, availability });
      return normalizeHtmlResponse(data.html, '<p>No se pudo generar el reporte ejecutivo.</p>');
    } catch (error) {
      const msg = errorMessage(error, 'Error generando el reporte ejecutivo.');
      console.warn('Gemini Error (Ejecutivo):', msg);
      return `<p class="text-red-500">${escapeHtml(msg)}</p>`;
    }
  }

  async generateLotoProcedure(asset: Asset, failureDescription: string): Promise<string> {
    try {
      const data = await this.callFunction<{ asset: Asset; failureDescription: string }, HtmlApiResponse>(
        'generateLotoProcedure',
        { asset, failureDescription }
      );
      return normalizeHtmlResponse(data.html, '<p>No se pudo generar el procedimiento LOTO.</p>');
    } catch (error) {
      const msg = errorMessage(error, 'Error generando el procedimiento LOTO.');
      console.warn('Gemini Error (LOTO):', msg);
      return `<p class="text-red-500">${escapeHtml(msg)}</p>`;
    }
  }

  async generateDailySummary(
    fleetData: { percentage: number },
    activeFailures: Pick<ForkliftFailureEntry, 'economico' | 'falla'>[],
    _history: unknown[]
  ): Promise<string> {
    return this.generateExecutiveReport(
      { availability: fleetData.percentage, mttr: 4.5, totalCostMonth: 12500, budgetMonth: 15000 },
      activeFailures,
      fleetData
    );
  }

  async analyzeImage(base64Image: string, mimeType: string): Promise<AIInspectionResponse> {
    try {
      const data = await this.callFunction<
        { base64Image: string; mimeType: string },
        AIInspectionResponse
      >('analyzeImage', { base64Image, mimeType });
      if (!data?.inspection?.asset?.component_affected) {
        return this.createFallbackInspectionResponse(
          'Respuesta incompleta',
          'El servicio de IA devolvió un payload de inspección incompleto.'
        );
      }
      return data;
    } catch (error) {
      const msg = errorMessage(error, 'Error al procesar la imagen.');
      console.warn('Gemini Error (Inspección):', msg);
      return this.createFallbackInspectionResponse('Falla al procesar imagen', msg);
    }
  }

  async getOperatorAdvice(category: string, notes: string): Promise<string> {
    try {
      const data = await this.callFunction<{ category: string; notes: string }, AdviceApiResponse>(
        'getOperatorAdvice',
        { category, notes }
      );
      return data.advice?.trim() || 'Reporte recibido. Proceda con precaución.';
    } catch (error) {
      const msg = errorMessage(error, 'Reporte recibido. Proceda con precaución.');
      console.warn('Gemini Error (Operador):', msg);
      return msg;
    }
  }
}
