/**
 * AssetGuard Corporate Edition Advanced - Vertex AI Backend
 * Firebase Functions HTTP endpoints for Gemini 2.5 Flash via Vertex AI
 * API key stays server-side, never exposed to client
 */

import { onRequest } from "firebase-functions/v2/https";
import { VertexAI, GenerativeModel } from "@google-cloud/vertexai";
import * as cors from "cors";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Vertex AI Configuration from environment variables (set as secrets)
const PROJECT_ID = process.env.GCP_PROJECT_ID || "";
const LOCATION = process.env.GCP_LOCATION || "us-central1";
const MODEL_NAME = "gemini-2.5-flash-preview-05-20";

// CORS middleware
const corsHandler = cors({ origin: true });

// Initialize Vertex AI client
const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const generativeModel = vertexAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096,
  },
});

// --- Helper: Execute prompt ---
async function runPrompt(prompt: string): Promise<string> {
  const result = await generativeModel.generateContent(prompt);
  return result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// --- 1. Analizar Historial de Mantenimiento ---
export const analyzeMaintenanceHistory = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const { asset, history } = req.body;
      const prompt = `Actúa como Analista de Mantenimiento Predictivo con especialización en Machine Learning aplicado a activos industriales.

ENTRADA DE DATOS:
Activo: ${asset.brand} ${asset.model} (ID: ${asset.id})
Historial de Fallas: ${JSON.stringify(history.map((h: any) => ({
  fecha: h.entryDate,
  tipo: h.type,
  componente: h.failureDescription,
  severidad: h.estimatedCost > 2000 ? 'Alta' : 'Media'
})))}

ANÁLISIS REQUERIDO:
1. DETECCIÓN DE PATRONES: Identifica fallas recurrentes y calcula MTBF aproximado.
2. PREDICCIÓN: Estima qué componente tiene mayor probabilidad de fallar próximamente.
3. RECOMENDACIONES: Sugiere inspecciones o reemplazos preventivos.

FORMATO DE SALIDA:
HTML limpio (sin markdown). Usa iconos y negritas.
Estructura:
<div class="space-y-4">
  <div><h4 class="font-bold text-red-400">Patrones Detectados</h4>...</div>
  <div><h4 class="font-bold text-orange-400">Riesgo Inminente</h4>...</div>
  <div><h4 class="font-bold text-green-400">Acción Recomendada</h4>...</div>
</div>`;
      const response = await runPrompt(prompt);
      res.status(200).json({ result: response || "<p>Datos insuficientes para predicción.</p>" });
    } catch (error: any) {
      console.error("Vertex AI Error:", error.message);
      res.status(500).json({ error: "Error conectando con el servicio de IA." });
    }
  });
});

// --- 2. Generar Reporte Ejecutivo Semanal ---
export const generateExecutiveReport = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const { kpi, activeFailures, availability } = req.body;
      const prompt = `Genera un Reporte Ejecutivo Semanal de Mantenimiento Industrial.

DATOS:
KPIs: Disponibilidad: ${availability.percentage}%, MTTR: ${kpi.mttr}h, Costo Mensual: $${kpi.totalCostMonth}, Presupuesto: $${kpi.budgetMonth}
Fallas Activas: ${JSON.stringify(activeFailures)}

Estructura requerida (HTML limpio, Tailwind):
- Header con resumen de disponibilidad y estado general
- Tabla de KPIs con indicadores de color (verde/amarillo/rojo)
- Top 3 fallas críticas con análisis 5-Why
- Gráfico sugerido (descripción textual de qué mostrar)
- Recomendaciones estratégicas para la próxima semana`;
      const response = await runPrompt(prompt);
      res.status(200).json({ result: response });
    } catch (error: any) {
      console.error("Vertex AI Error:", error.message);
      res.status(500).json({ error: "Error generando reporte ejecutivo." });
    }
  });
});

// --- 3. Analizar Imagen (análisis visual de activos) ---
export const analyzeImage = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const { imageData, assetInfo } = req.body;
      const prompt = `Analiza esta imagen de un activo industrial y genera un reporte técnico.

Activo: ${assetInfo.brand} ${assetInfo.model}
Tipo de activo: ${assetInfo.type || "Industrial"}

Identifica:
1. Estado visible del equipo (desgaste, corrosión, daños)
2. Componentes críticos observables
3. Recomendaciones de mantenimiento inmediato
4. Riesgos de seguridad identificados

FORMATO: HTML limpio con secciones marcadas con iconos Tailwind.`;
      const content = {
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: imageData } }
          ]
        }]
      };
      const result = await generativeModel.generateContent(content);
      const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      res.status(200).json({ result: response });
    } catch (error: any) {
      console.error("Vertex AI Image Error:", error.message);
      res.status(500).json({ error: "Error analizando imagen." });
    }
  });
});

// --- 4. Generar Procedimiento LOTO ---
export const generateLotoProcedure = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const { asset, task } = req.body;
      const prompt = `Genera un procedimiento completo de Lockout/Tagout (LOTO) para:

Activo: ${asset.brand} ${asset.model} (ID: ${asset.id})
Tarea de mantenimiento: ${task}

Estructura requerida (HTML, formato empresarial OSHA/NOM-004-STPS):
1. Identificación de fuentes de energía (eléctrica, neumática, hidráulica, gravitacional)
2. Secuencia de apagado seguro paso a paso
3. Puntos de aislamiento específicos del equipo
4. Dispositivos de bloqueo requeridos (candados, tags, hasps)
5. Verificación de energía cero (test de intento de arranque)
6. Procedimiento de retorno a operación

Usa formato HTML con clases Tailwind para tablas y listas.`;
      const response = await runPrompt(prompt);
      res.status(200).json({ result: response });
    } catch (error: any) {
      console.error("Vertex AI LOTO Error:", error.message);
      res.status(500).json({ error: "Error generando procedimiento LOTO." });
    }
  });
});

// --- 5. Asesor de Operador ---
export const getOperatorAdvice = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const { question, context } = req.body;
      const prompt = `Eres un Asistente Técnico especializado en mantenimiento de activos industriales.

Contexto del activo: ${JSON.stringify(context)}

Pregunta del operador: ${question}

Proporciona:
1. Respuesta directa y práctica
2. Pasos de acción inmediatos si aplica
3. Referencia a manuales o normas relevantes (OSHA, NOM, ISO)
4. Advertencias de seguridad si corresponde

Mantén un tono profesional pero accesible para operadores de planta.`;
      const response = await runPrompt(prompt);
      res.status(200).json({ result: response });
    } catch (error: any) {
      console.error("Vertex AI Advice Error:", error.message);
      res.status(500).json({ error: "Error obteniendo asesoramiento." });
    }
  });
});

// --- Health check endpoint ---
export const health = onRequest(async (req, res) => {
  corsHandler(req, res, () => {
    res.status(200).json({
      status: "healthy",
      service: "asset-guard-vertex-ai",
      model: MODEL_NAME,
      project: PROJECT_ID,
      location: LOCATION,
      timestamp: new Date().toISOString()
    });
  });
});
