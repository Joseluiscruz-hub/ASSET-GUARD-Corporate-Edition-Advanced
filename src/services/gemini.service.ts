import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { FailureReport, Asset, KPIData, AIInspectionResponse } from '../types';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  
  // Inicializamos usando el nuevo SDK y tu API Key configurada
  private ai = new GoogleGenAI({ 
    apiKey: environment.geminiApiKey?.trim() || 'TU_API_KEY_FALLBACK'
  });

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
        
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || '<p>Datos insuficientes para predicción.</p>';
    } catch (error) {
      console.warn('Gemini Error (Predictivo): falló predicción', error);
      return '<p class="text-red-500">Error conectando con el servicio de IA.</p>';
    }
  }

  // --- PROMPT 5: RESUMEN EJECUTIVO DIARIO ---
  async generateExecutiveReport(kpi: KPIData, activeFailures: any[], availability: any): Promise<string> {
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
        <p>Si disponibilidad &lt; 90%, resalta urgencia.</p>

        TONO: Profesional, directo, español mexicano empresarial. Sin saludos.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawResponse = response.text || 'No se pudo generar el reporte ejecutivo.';
      return rawResponse.replace(/```html|```/g, '').trim();
    } catch (error) {
      console.warn('Gemini Error: Falló reporte ejecutivo', error);
      return '<p class="text-red-500 font-bold">Error conectando con IA para generar el reporte diario. Revisa la clave API o la conexión.</p>';
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

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || 'Error generando LOTO.';
    } catch (error) {
       return '<p>No disponible.</p>';
    }
  }

  // --- Helper for Daily Summary (Legacy) ---
  async generateDailySummary(fleetData: any, activeFailures: any[], history: any[]): Promise<string> {
    void history;
    return this.generateExecutiveReport(
      { availability: fleetData.percentage, mttr: 4.5, totalCostMonth: 12500, budgetMonth: 15000 },
      activeFailures,
      fleetData
    );
  }

  // --- PROMPT 2: INSPECCIÓN VISUAL MULTIMODAL ---
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

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType } }
          ]
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('La IA no devolvió ninguna respuesta de texto.');
      }

      let cleanText = text.replace(/```json|```/g, '').trim();
      
      cleanText = cleanText.replace(/:\s*undefined/g, ': null');
      cleanText = cleanText.replace(/\[\s*undefined\s*\]/g, '[null]');
      cleanText = cleanText.replace(/,\s*undefined\s*,/g, ', null,');
      cleanText = cleanText.replace(/\bundefined\b/g, 'null');
      
      if (!cleanText || cleanText.toLowerCase() === 'undefined' || cleanText.toLowerCase() === 'null') {
        throw new Error('La respuesta de la IA está vacía o es inválida.');
      }

      try {
        return JSON.parse(cleanText) as AIInspectionResponse;
      } catch (parseError) {
        void parseError;
        return {
          inspection: {
            timestamp: new Date().toISOString(),
            asset: { component_affected: 'Desconocido', subcomponent: '', visual_condition: 'Formato inválido', context_analysis: '' },
            ai_confidence_score: 0,
            observations: ['La IA devolvió formato incorrecto.'],
            safety_hazards: [],
            recommended_actions: [],
            image_quality_warning: 'true'
          }
        } as AIInspectionResponse;
      }
    } catch (error: unknown) {
      void error;
      return {
        inspection: {
          timestamp: new Date().toISOString(),
          asset: { component_affected: 'Desconocido', subcomponent: '', visual_condition: 'Falla al procesar imagen', context_analysis: '' },
          ai_confidence_score: 0,
          observations: ['Error de la IA.'],
          safety_hazards: [],
          recommended_actions: [],
          image_quality_warning: 'true'
        }
      } as AIInspectionResponse;
    }
  }

  // --- PROMPT 4: ASISTENTE PARA OPERADORES (CONSEJOS RÁPIDOS) ---
  async getOperatorAdvice(category: string, notes: string): Promise<string> {
    try {
      const prompt = `
        Actúa como un Supervisor de Mantenimiento experto. Un operador está reportando una falla.
        Categoría: ${category}
        Notas del operador: ${notes}

        Proporciona un consejo corto (máximo 2 frases) sobre qué debe hacer el operador inmediatamente (ej: detener el equipo, revisar niveles, etc.) para su seguridad y para no dañar más el equipo.
        Tono: Directo, empático, español mexicano. Sin saludos.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || 'Reporte recibido. Proceda con precaución.';
    } catch (error) {
      void error;
      return 'Reporte recibido. Proceda con precaución.';
    }
  }
}
