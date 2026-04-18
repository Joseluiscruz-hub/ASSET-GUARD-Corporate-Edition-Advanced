# 📘 Guía de Integración — AssetGuard Advanced IA

Esta guía detalla cómo utilizar los nuevos métodos de IA fusionados en `gemini.service.ts` dentro de tus componentes de Angular.

---

## 🚀 1. Inyección del Servicio

Asegúrate de inyectar el servicio en tu componente:

```typescript
import { inject } from '@angular/core';
import { GeminiService } from './services/gemini.service';

export class TuComponente {
  private gemini = inject(GeminiService);
  // ...
}
```

---

## 🤖 2. Ejemplos de Uso de Métodos IA

### A. Análisis Predictivo de Activos
Ideal para la vista de **Detalle de Activo**. Analiza el historial para predecir fallas.

```typescript
async verPrediccion(asset: Asset, history: FailureReport[]) {
  try {
    const htmlResultado = await this.gemini.analyzeMaintenanceHistory(asset, history);
    this.panelIA.mostrar(htmlResultado);
  } catch (err) {
    console.error(err.message); // El helper getAi() lanzará error si falta la API Key
  }
}
```

### B. Inspección Visual Multimodal
Permite al operador subir una foto de una pieza dañada y obtener un diagnóstico técnico JSON.

```typescript
async procesarFoto(base64: string, tipo: string) {
  const data = await this.gemini.analyzeImage(base64, tipo);
  console.log('Severidad:', data.inspection.severity.level);
  console.log('Causa Raíz:', data.inspection.root_cause_analysis.probable_cause);
}
```

### C. Generador de Procedimientos LOTO
Genera instantáneamente una guía de bloqueo/etiquetado basada en la falla reportada.

```typescript
async prepararSeguridad(asset: Asset, falla: string) {
  const lotoHtml = await this.gemini.generateLotoProcedure(asset, falla);
  this.modalSeguridad.open(lotoHtml);
}
```

---

## 🔐 3. Control de Acceso por Roles

Usa el nuevo `AuthService` para proteger la UI:

```typescript
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export class AdminPanel {
  auth = inject(AuthService);

  // Determinar si el usuario puede ver botones sensibles
  puedeBorrar = computed(() => this.auth.hasRole(['admin']));
  esTecnico = computed(() => this.auth.hasRole(['admin', 'technician']));
}
```

---

## ⚠️ 4. Manejo de Errores IA

El servicio utiliza el helper `getAi()` que garantiza que la aplicación no intente llamar a Google GenAI sin una llave válida.

**Recomendación de UI:**
Implementa un `snackbar` o alerta global que escuche los errores de promesa de estos métodos para informar al usuario sobre la configuración de la API Key.

---

## 🗺️ Roadmap de Evolución IA

1.  **Cypress E2E para IA**: Mock de respuestas de Gemini para pruebas de UI sin consumo de cuota.
2.  **Tooltips Dinámicos**: Integrar `getOperatorAdvice()` como burbujas de ayuda en el formulario de reporte.
3.  **Historial de Chats**: Guardar las recomendaciones de IA en Firestore por activo.
4.  **Dashboard Ejecutivo**: Renderizado automático del reporte semanal cada lunes.

---
*Documentación generada para AssetGuard Corporate Edition Advanced 2026*
