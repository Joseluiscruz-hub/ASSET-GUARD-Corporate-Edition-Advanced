// =======================================================================================
// gemini.service.ts — AssetGuard Corporate Edition Advanced
// Fusión definitiva de los 3 repositorios:
//   - Prompts avanzados de 'main' (LOTO, análisis predictivo, reporte ejecutivo)
//   - getAi() helper de 'Edithion' (gestión segura de API key)
//   - analyzeImage() extendido de 'Edithion' (limpieza de JSON, 5-Why analysis)
//   - Integración con environment.ts de 'Corporate-Edition'
// =======================================================================================

import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FailureReport, Asset, KPIData, AIInspectionResponse, ForkliftFailureEntry } from '../types';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenerativeAI | null;

  private defaultSummaryKpi: KPIData = {
    availability: 0,
    mttr: 4.5,
    totalCostMonth: 12500,
    budgetMonth: 15000,
  };

  constructor() {
    // Lee del environment de Angular (no de import.meta.env)
    const apiKey = environment.geminiApiKey?.trim() ?? '';
    this.ai = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  // Helper seguro (de Edithion) — lanza error explícito si falta la API key
  private getAi(): GoogleGenerativeAI {
    if (!this.ai) {
      throw new Error('⚠️ Gemini API Key no configurada. Verifique secretos en GitHub o environment.ts');
    }
    return this.ai;
  }

  // --- BONUS 1: PREDICCIÓN DE FALLAS (MANTENIMIENTO PREDICTIVO) ---
  async analyzeMaintenanceHistory(asset: Asset, history: FailureReport[]): Promise<string> {
    try {
      const prompt = `
      Actúa como Analista de Mantenimiento Predictivo con especialización en Machine Learning aplicado a activos industriales.

      ENTRADA DE DATOS:
      Activo: ${asset.brand} ${asset.model} (ID: ${asset.id})
      Historial de Fallas:
      ${JSON.stringify(history.map(h => ({
        fecha: h.entryDate,
        tipo: h.type,
        componente: h.failureDescription,
        severidad: h.estimatedCost > 2000 ? 'Alta' : 'Media'
      })))}

      ANÁLISIS REQUERIDO:
      1. 🔮 DETECCIÓN DE PATRONES: Identifica fallas recurrentes y calcula MTBF aproximado.
      2. 📈 PREDICCIÓN: Estima qué componente tiene mayor probabilidad de fallar próximamente.
      3. ⚙️ RECOMENDACIONES: Sugiere inspecciones o reemplazos preventivos.

      FORMATO DE SALIDA:
      HTML limpio (sin markdown \`\`\`html). Usa iconos y negritas.
      Estructura:
      <div class="space-y-4">
        <div><h4 class="font-bold text-red-400">🔮 Patrones Detectados</h4>...</div>
        <div><h4 class="font-bold text-orange-400">⚠️ Riesgo Inminente</h4>...</div>
        <div><h4 class="font-bold text-green-400">✅ Acción Recomendada</h4>...</div>
      </div>
      `;

      const model = this.getAi().getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || '<p>Datos insuficientes para predicción.</p>';
    } catch (error) {
      console.error('Gemini Error:', error);
      return '<p class="text-red-500">Error conectando con el servicio de IA.</p>';
    }
  }

  // --- PROMPT 5: RESUMEN EJECUTIVO SEMANAL ---
  async generateExecutiveReport(
    kpi: KPIData,
    activeFailures: Pick<ForkliftFailureEntry, 'economico' | 'falla'>[],
    availability: { percentage: number }
  ): Promise<string> {
    try {
      const prompt = `
      Analiza el estado actual de AssetGuard CMMS y genera un resumen ejecutivo profesional para Gerencia de Operaciones.

      DATOS:
      - Disponibilidad: ${availability.percentage}% (Meta: 95%)
      - MTTR Promedio: ${kpi.mttr} horas
      - Gasto Mes: $${kpi.totalCostMonth} USD
      - Equipos Detenidos (Top 3): ${JSON.stringify(activeFailures.slice(0, 3).map(f => `${f.economico} (${f.falla})`))}

      ESTRUCTURA DEL REPORTE (HTML simple para renderizar):
      <h3>📊 1. KPIs DE DISPONIBILIDAD</h3>
      <p>Resumen de estado vs meta.</p>

      <h3>🔴 2. ANÁLISIS DE PARETO (Top Problemas)</h3>
      <p>Menciona los equipos críticos detenidos actualmente.</p>

      <h3>💡 3. RECOMENDACIONES ESTRATÉGICAS</h3>
      <ul>
        <li>Acción 1 para reducir downtime</li>
        <li>Acción 2 para optimizar costos</li>
      </ul>

      <h3>⚠️ 4. ALERTAS CRÍTICAS</h3>
      <p>Si disponibilidad < 90%, resalta urgencia.</p>

      TONO: Profesional, directo, español mexicano empresarial. Sin saludos.
      `;

      const model = this.getAi().getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || 'No se pudo generar el reporte ejecutivo.';
    } catch (error) {
      console.error('Gemini Error:', error);
      return 'Error conectando con IA para el reporte.';
    }
  }

  // --- BONUS 3: GENERADOR DE PROCEDIMIENTOS DE SEGURIDAD (LOTO) ---
  async generateLotoProcedure(asset: Asset, failureDescription: string): Promise<string> {
    try {
      const prompt = `
      Actúa como Ingeniero de Seguridad Industrial certificado en LOTO (NOM-004-STPS-1999).
      Genera un procedimiento de bloqueo/etiquetado para:

      Equipo: ${asset.brand} ${asset.model} (${asset.fuelType})
      Tarea: Reparación de ${failureDescription}

      ESTRUCTURA HTML (Lista de verificación):
      <div class="loto-card">
        <h3 class="text-red-600 font-bold mb-2">🚨 IDENTIFICACIÓN DE PELIGROS</h3>
        [Lista de energías peligrosas: Eléctrica, Hidráulica, etc.]

        <h3 class="text-blue-600 font-bold mt-4 mb-2">🔒 SECUENCIA DE BLOQUEO</h3>
        <ol class="list-decimal pl-4 space-y-2">
          <li>Paso 1...</li>
          <li>Paso 2...</li>
        </ol>

        <h3 class="text-green-600 font-bold mt-4 mb-2">✅ VERIFICACIÓN ENERGÍA CERO</h3>
        [Cómo verificar que es seguro trabajar]
      </div>

      Resalta ADVERTENCIAS DE SEGURIDAD en negritas.
      `;

      const model = this.getAi().getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || 'Error generando LOTO.';
    } catch {
      return '<p>No disponible.</p>';
    }
  }

  // --- PROMPT 2: INSPECCIÓN VISUAL MULTIMODAL (fusión main + Edithion) ---
  async analyzeImage(base64Image: string, mimeType: string): Promise<AIInspectionResponse> {
    try {
      const prompt = `
      Actúa como un Ingeniero de Mantenimiento Experto y Especialista en Seguridad Industrial.
      Analiza la imagen proporcionada de un componente de montacargas o equipo industrial.

      Debes devolver un objeto JSON que siga estrictamente esta estructura:
      {
        "inspection": {
          "timestamp": "${new Date().toISOString()}",
          "asset": {
            "component_affected": "Nombre del componente principal",
            "subcomponent": "Subcomponente específico detectado",
            "visual_condition": "Estado visual general",
            "context_analysis": "Análisis del entorno y condiciones de operación"
          },
          "damage_analysis": {
            "damage_type": "Tipo de daño (ej: Desgaste, Fatiga, Impacto, Fuga, Corrosión)",
            "visible_signs": ["lista de signos visibles"],
            "affected_area_percentage": "Porcentaje estimado",
            "technical_description": "Descripción técnica profunda"
          },
          "severity": {
            "level": "BAJA" | "MEDIA" | "ALTA" | "CRÍTICA",
            "risk_score": "Puntuación 0-100",
            "safety_impact": "Riesgo para el operador",
            "operational_impact": "Efecto en la productividad",
            "environmental_impact": "Riesgo de contaminación/derrames"
          },
          "root_cause_analysis": {
            "probable_cause": "Causa raíz más probable",
            "why_analysis": ["Por qué 1", "Por qué 2", "Por qué 3", "Por qué 4", "Por qué 5"],
            "contributing_factors": ["factores externos"]
          },
          "immediate_actions": {
            "safety_measures": ["pasos de seguridad inmediatos"],
            "containment_actions": ["acciones para evitar que el daño progrese"]
          },
          "repair_plan": {
            "estimated_parts": [
              { "part_name": "nombre", "generic_code": "código SAP genérico", "quantity": "cantidad", "criticality": "Alta/Media/Baja" }
            ],
            "estimated_mttr_hours": "Tiempo estimado de reparación",
            "estimated_cost_usd": { "min": 0, "max": 0 },
            "recommended_specialists": ["tipo de técnico requerido"]
          }
        }
      }

      REGLAS CRÍTICAS:
      1. Devuelve ÚNICAMENTE el objeto JSON.
      2. No incluyas bloques de código markdown (\`\`\`json).
      3. Si la imagen no es clara, incluye una advertencia en el campo 'image_quality_warning'.
      4. El idioma debe ser Español Mexicano Técnico.
      5. NUNCA uses el valor \`undefined\` en el JSON. Usa \`null\` si un valor es desconocido.
      `;

      const model = this.getAi().getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType } }
      ]);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('La IA no devolvió ninguna respuesta de texto.');
      }

      // Limpieza de markdown y valores undefined (de Edithion)
      let cleanText = text.replace(/```json|```/g, '').trim();
      cleanText = cleanText.replace(/:\s*undefined/g, ': null');

      if (!cleanText || cleanText.toLowerCase() === 'undefined' || cleanText.toLowerCase() === 'null') {
        throw new Error('La respuesta de la IA está vacía o es inválida.');
      }

      try {
        return JSON.parse(cleanText) as AIInspectionResponse;
      } catch (parseError) {
        console.error('Error al parsear JSON de Gemini:', cleanText);
        throw new Error('La IA devolvió un formato de datos incorrecto.', { cause: parseError });
      }
    } catch (error) {
      console.error('Gemini Image Analysis Error:', error);
      throw error;
    }
  }

  // --- PROMPT 4: ASISTENTE PARA OPERADORES (de Edithion) ---
  async getOperatorAdvice(category: string, notes: string): Promise<string> {
    try {
      const prompt = `
      Actúa como un Supervisor de Mantenimiento experto. Un operador está reportando una falla.

      Categoría: ${category}
      Notas del operador: ${notes}

      Proporciona un consejo corto (máximo 2 frases) sobre qué debe hacer el operador inmediatamente (ej: detener el equipo, revisar niveles, etc.) para su seguridad y para no dañar más el equipo.

      Tono: Directo, empático, español mexicano. Sin saludos.
      `;

      const model = this.getAi().getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || 'Reporte recibido. Proceda con precaución.';
    } catch (error) {
      return 'Reporte recibido. Proceda con precaución.';
    }
  }

  // --- Helper for Daily Summary (Legacy) ---
  async generateDailySummary(
    fleetData: { percentage: number },
    activeFailures: Pick<ForkliftFailureEntry, 'economico' | 'falla'>[],
    _history: unknown[]
  ): Promise<string> {
    this.defaultSummaryKpi.availability = fleetData.percentage;
    return this.generateExecutiveReport(this.defaultSummaryKpi, activeFailures, fleetData);
  }
}
