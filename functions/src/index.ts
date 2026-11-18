/**
 * AssetGuard Corporate Edition Advanced — Gemini 2.5 Flash backend.
 *
 * HTTPS callable functions. Require a Firebase ID token (`request.auth`).
 * The Gemini API key is bound as a Functions secret: GEMINI_API_KEY.
 *
 * Cruz must create the secret and deploy, for example:
 *   firebase functions:secrets:set GEMINI_API_KEY
 *   firebase deploy --only functions
 *
 * APIs used (verified against current docs / typings, not invented):
 * - onCall, HttpsError from firebase-functions/https (Firebase Functions 7.4.0)
 * - defineSecret from firebase-functions/params
 * - GoogleGenAI from @google/genai 3.5.0 (constructor { apiKey }, models.generateContent, response.text)
 */
import { initializeApp } from 'firebase-admin/app';
import { onCall, HttpsError } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';
import {
  MODEL_NAME,
  generateWithRetry,
  sanitizeInspectionJsonText,
  stripHtmlFences,
} from './ai-utils.js';

initializeApp();

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const CALLABLE_OPTIONS = {
  secrets: [geminiApiKey],
  region: 'us-central1',
  timeoutSeconds: 120,
  memory: '512MiB' as const,
};

function requireAuth(request: { auth?: unknown }): void {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar el servicio de IA.');
  }
}

function getClient(): GoogleGenAI {
  const apiKey = geminiApiKey.value()?.trim();
  if (!apiKey) {
    throw new HttpsError(
      'failed-precondition',
      'GEMINI_API_KEY no está configurada en el entorno de Functions.'
    );
  }
  return new GoogleGenAI({ apiKey });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function mapGenerateError(error: unknown, contextLabel: string): never {
  const err = error as { status?: number; code?: string; message?: string };
  const status = err.status;
  if (status === 429) {
    throw new HttpsError('resource-exhausted', `La cuota de IA se agotó (${contextLabel}). Intenta más tarde.`);
  }
  const message = err.message || `Error en el servicio de IA (${contextLabel}).`;
  console.error(`[Gemini ${contextLabel}]`, message);
  throw new HttpsError('internal', message);
}

async function generateText(prompt: string, contextLabel: string): Promise<string> {
  const client = getClient();
  try {
    const response = await generateWithRetry(() =>
      client.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      })
    );
    return stripHtmlFences(response.text || '');
  } catch (error) {
    mapGenerateError(error, contextLabel);
  }
}

export const analyzeMaintenanceHistory = onCall(CALLABLE_OPTIONS, async (request) => {
  requireAuth(request);
  const data = asRecord(request.data);
  const asset = asRecord(data['asset']);
  if (!asset['id']) {
    throw new HttpsError('invalid-argument', 'Se requiere información válida del activo.');
  }
  const history = Array.isArray(data['history']) ? data['history'] : [];
  const prompt = `
    Actúa como Analista de Mantenimiento Predictivo con especialización en Machine Learning aplicado a activos industriales.

    ENTRADA DE DATOS:
    Activo: ${asset['brand']} ${asset['model']} (ID: ${asset['id']})
    Historial de Fallas:
    ${JSON.stringify(
      history.map((item) => {
        const h = asRecord(item);
        const cost = Number(h['estimatedCost'] ?? 0);
        return {
          fecha: h['entryDate'],
          tipo: h['type'],
          componente: h['failureDescription'],
          severidad: cost > 2000 ? 'Alta' : 'Media',
        };
      })
    )}

    ANÁLISIS REQUERIDO:
    1. DETECCIÓN DE PATRONES: Identifica fallas recurrentes y calcula MTBF aproximado.
    2. PREDICCIÓN: Estima qué componente tiene mayor probabilidad de fallar próximamente.
    3. RECOMENDACIONES: Sugiere inspecciones o reemplazos preventivos.

    FORMATO DE SALIDA:
    HTML limpio (sin markdown \`\`\`html). Usa iconos y negritas.
    Estructura:
    <div class="space-y-4">
      <div><h4 class="font-bold text-red-400">Patrones Detectados</h4>...</div>
      <div><h4 class="font-bold text-orange-400">Riesgo Inminente</h4>...</div>
      <div><h4 class="font-bold text-green-400">Acción Recomendada</h4>...</div>
    </div>
  `;
  const html = (await generateText(prompt, 'predictivo')) || '<p>Datos insuficientes para predicción.</p>';
  return { html };
});

export const generateExecutiveReport = onCall(CALLABLE_OPTIONS, async (request) => {
  requireAuth(request);
  const data = asRecord(request.data);
  const kpi = asRecord(data['kpi']);
  const availability = asRecord(data['availability']);
  const activeFailures = Array.isArray(data['activeFailures']) ? data['activeFailures'] : [];
  const prompt = `
    Genera un Reporte Ejecutivo de Mantenimiento Industrial.

    DATOS:
    KPIs: Disponibilidad: ${availability['percentage']}%, MTTR: ${kpi['mttr']}h, Costo Mensual: $${kpi['totalCostMonth']}, Presupuesto: $${kpi['budgetMonth']}
    Fallas Activas: ${JSON.stringify(activeFailures)}

    Estructura requerida (HTML limpio, sin markdown, clases Tailwind):
    - Header con resumen de disponibilidad y estado general
    - Tabla de KPIs con indicadores de color (verde/amarillo/rojo)
    - Top 3 fallas críticas con análisis 5-Why
    - Recomendaciones estratégicas para la próxima semana
  `;
  const html = await generateText(prompt, 'reporte-ejecutivo');
  return { html };
});

export const generateLotoProcedure = onCall(CALLABLE_OPTIONS, async (request) => {
  requireAuth(request);
  const data = asRecord(request.data);
  const asset = asRecord(data['asset']);
  const failureDescription = String(data['failureDescription'] ?? data['task'] ?? '');
  if (!asset['id'] || !failureDescription) {
    throw new HttpsError('invalid-argument', 'Se requiere el activo y la descripción de la tarea.');
  }
  const prompt = `
    Genera un procedimiento completo de Lockout/Tagout (LOTO) conforme a NOM-004-STPS-1999.

    Activo: ${asset['brand']} ${asset['model']} (ID: ${asset['id']})
    Tarea de mantenimiento: ${failureDescription}

    Estructura requerida (HTML, formato empresarial):
    1. Identificación de fuentes de energía (eléctrica, neumática, hidráulica, gravitacional)
    2. Secuencia de apagado seguro paso a paso
    3. Puntos de aislamiento específicos del equipo
    4. Dispositivos de bloqueo requeridos (candados, tags, hasps)
    5. Verificación de energía cero (test de intento de arranque)
    6. Procedimiento de retorno a operación

    Usa formato HTML limpio (sin markdown) con clases Tailwind para tablas y listas.
  `;
  const html = await generateText(prompt, 'loto');
  return { html };
});

export const analyzeImage = onCall(CALLABLE_OPTIONS, async (request) => {
  requireAuth(request);
  const data = asRecord(request.data);
  const base64Image = String(data['base64Image'] ?? data['imageData'] ?? '');
  const mimeType = String(data['mimeType'] ?? 'image/jpeg');
  if (!base64Image) {
    throw new HttpsError('invalid-argument', 'Se requiere una imagen en base64.');
  }

  const prompt = `
    Analiza esta imagen de un activo industrial y genera un reporte técnico de inspección en JSON.
    Identifica componente afectado, tipo de daño, severidad, causa probable, acciones inmediatas y plan de reparación.
    Responde únicamente con JSON válido que siga esta estructura:
    {
      "inspection": {
        "timestamp": "ISO-8601",
        "asset": {
          "component_affected": "",
          "subcomponent": "",
          "visual_condition": "",
          "context_analysis": ""
        },
        "damage_analysis": {
          "damage_type": "",
          "visible_signs": [],
          "affected_area_percentage": "",
          "technical_description": ""
        },
        "severity": {
          "level": "BAJA|MEDIA|ALTA|CRITICA",
          "risk_score": "",
          "safety_impact": "",
          "operational_impact": "",
          "environmental_impact": ""
        },
        "root_cause_analysis": {
          "probable_cause": "",
          "why_analysis": [],
          "contributing_factors": []
        },
        "immediate_actions": {
          "safety_measures": [],
          "containment_actions": []
        },
        "repair_plan": {
          "estimated_parts": [],
          "estimated_mttr_hours": "",
          "estimated_cost_usd": { "min": 0, "max": 0 },
          "recommended_specialists": []
        }
      }
    }
  `;

  const client = getClient();
  try {
    const response = await generateWithRetry(() =>
      client.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType } },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      })
    );
    const clean = sanitizeInspectionJsonText(response.text || '');
    try {
      return JSON.parse(clean) as unknown;
    } catch {
      throw new HttpsError('internal', 'La IA devolvió un JSON de inspección inválido.');
    }
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    mapGenerateError(error, 'inspección visual');
  }
});

export const getOperatorAdvice = onCall(CALLABLE_OPTIONS, async (request) => {
  requireAuth(request);
  const data = asRecord(request.data);
  const category = String(data['category'] ?? '');
  const notes = String(data['notes'] ?? data['question'] ?? '');
  const prompt = `
    Eres un Asistente Técnico especializado en mantenimiento de activos industriales.
    Categoría reportada: ${category}
    Notas del operador: ${notes}

    Proporciona:
    1. Respuesta directa y práctica
    2. Pasos de acción inmediatos si aplica
    3. Referencia a normas relevantes (OSHA, NOM, ISO) cuando corresponda
    4. Advertencias de seguridad si aplica

    Responde en texto plano, breve y en español, tono profesional y accesible para operadores de planta.
  `;
  const advice = await generateText(prompt, 'asesor-operador');
  return { advice };
});
