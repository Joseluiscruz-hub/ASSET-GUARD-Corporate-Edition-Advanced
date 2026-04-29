# 🏭 AssetGuard Corporate Edition Advanced

> **Fusión definitiva** de los tres repositorios AssetGuard — lo mejor de cada uno en una sola plataforma enterprise-grade para gestión de activos industriales con IA predictiva.

[![Angular](https://img.shields.io/badge/Angular-19+-red?logo=angular)](https://angular.io)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime+Firestore-orange?logo=firebase)](https://firebase.google.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue?logo=google)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://typescriptlang.org)

---

## 🎯 Objetivo

Este repositorio representa la **versión avanzada y fusionada** de AssetGuard, integrando:

| Repositorio Fuente | Contribución Principal |
|---|---|
| `ASSET-GUARD-Corporate-Edition-main` | IA Gemini 2.5 Flash, prompts avanzados, análisis predictivo, LOTO |
| `ASSET-GUARD-Corporate-Edition` | UI moderna, signals Angular, autenticación Firebase, panel AI |
| `ASSET-GUARD-Corporative-Edithion` | Modularidad, roles de usuario, WorkOrders, Inventory, `getAi()` helper |

---

## ✨ Funcionalidades Principales

### 🤖 Inteligencia Artificial (Gemini 2.5 Flash)
- **Análisis Predictivo de Mantenimiento** — detecta patrones, calcula MTBF, predice fallas
- **Reporte Ejecutivo Semanal** — KPIs, Pareto de problemas, recomendaciones estratégicas en HTML
- **Inspección Visual Multimodal** — analiza imágenes de componentes dañados con JSON estructurado
- **Procedimientos LOTO** — genera checklist de seguridad (NOM-004-STPS-1999) por equipo y falla
- **Asistente de Operadores** — consejos inmediatos al reportar fallas en campo
- **Helper `getAi()`** — gestión segura de la API key con error explícito si falta

### 🖥️ Interfaz de Usuario
- Dashboard NOC con KPIs en tiempo real (Disponibilidad, MTTR, Costos)
- Panel AI deslizable con resultados HTML sanitizados (DOMPurify)
- Modo planta / modo corporativo (toggle automático por vista)
- Alertas sonoras para fallas críticas
- Animaciones de entrada con `fadeIn`
- Diseño responsive enterprise (Tailwind CSS)

### 🔐 Autenticación Avanzada (Fusión)
- Email/Password con manejo de errores en español mexicano
- Google OAuth (signInWithPopup)
- Modo Demo con autenticación anónima Firebase + fallback offline
- Signals reactivos: `currentUser`, `isLoading`, `isAuthenticated`, `error`
- Roles de usuario: `admin | planner | technician | viewer`
- Sincronización de perfil en Firestore (colección `users`)
- Helper `hasRole(roles[])` para control de acceso granular

### 📊 Gestión de Activos
- Inventario de flota con filtros y búsqueda
- Historial de fallas bidireccional (Planta ↔ Toyota)
- Órdenes de trabajo (WorkOrders)
- Programa de mantenimiento SMP (Compliance)
- Integración HACCP / inocuidad alimentaria
- Panel operador (Solicitor)
- Análisis por zona (HomeStep1)
- Inspección de activos con detalles extendidos

---

## 🏗️ Arquitectura

```
src/
├── app.component.ts          # Orquestador principal (signals + effects + AI)
├── app.component.html        # Template con panel AI, navegación, auth
├── types.ts                  # Tipos unificados de los 3 repos
├── firebase-init.ts          # Inicialización Firebase (app, auth, db)
│
├── services/
│   ├── gemini.service.ts     # IA avanzada: 5 métodos + getAi() helper
│   ├── auth.service.ts       # Auth fusionado: Email + Google + Demo + Roles
│   └── data.service.ts       # DataService: KPIs, activos, fallas (RTDB)
│
├── guards/
│   └── auth.guard.ts         # Guard de rutas con roles
│
├── components/
│   ├── dashboard/            # Panel NOC con KPIs en tiempo real
│   ├── asset-list/           # Inventario de flota
│   ├── asset-detail/         # Detalle + historial + análisis IA por activo
│   ├── admin/                # Panel administrativo
│   ├── service-panel/        # Gestión técnica Toyota (fallas activas)
│   ├── solicitor-panel/      # App operador (reporte de fallas)
│   ├── login/                # Pantalla de autenticación
│   ├── maintenance-compliance/ # Programa SMP
│   ├── home-step1/           # Análisis por zona
│   ├── inventory/            # Inventario extendido (de Edithion)
│   └── work-orders/          # Órdenes de trabajo (de Edithion)
│
└── environments/
    └── environment.ts        # Config: geminiApiKey, firebase
```

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Joseluiscruz-hub/ASSET-GUARD-Corporate-Edition-Advanced.git
cd ASSET-GUARD-Corporate-Edition-Advanced
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env.local`:

```env
VITE_GEMINI_API_KEY=tu_api_key_de_google_ai_studio
```

Crear/editar `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  geminiApiKey: import.meta.env['VITE_GEMINI_API_KEY'] || '',
  firebase: {
    apiKey: "...",
    authDomain: "...",
    databaseURL: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  }
};
```

### 3. Ejecutar en desarrollo

```bash
npm start
# o
npx vite
```

### 4. Build para producción

```bash
npm run build
```

---

## 🔑 Variables de Entorno

| Variable | Descripción | Requerido |
|---|---|---|
| `VITE_GEMINI_API_KEY` | API Key de Google AI Studio (Gemini) | Sí (para IA) |
| Firebase config | En `environment.ts` | Sí (para auth/db) |

---

## 🤖 Prompts de Gemini — Referencia

### 1. Análisis Predictivo (`analyzeMaintenanceHistory`)
- **Modelo**: `gemini-2.5-flash`
- **Input**: `Asset` + `FailureReport[]`
- **Output**: HTML con patrones detectados, riesgo inminente, acción recomendada

### 2. Inspección Visual (`analyzeImage`)
- **Modelo**: `gemini-2.5-flash` (multimodal)
- **Input**: `base64Image` + `mimeType`
- **Output**: JSON estructurado `AIInspectionResponse` (severidad, causa raíz, refacciones)

### 3. Reporte Ejecutivo (`generateExecutiveReport`)
- **Modelo**: `gemini-2.5-flash`
- **Input**: `KPIData` + `ForkliftFailureEntry[]` + disponibilidad
- **Output**: HTML con KPIs, Pareto, recomendaciones estratégicas, alertas

### 4. Procedimiento LOTO (`generateLotoProcedure`)
- **Modelo**: `gemini-2.5-flash`
- **Input**: `Asset` + descripción de falla
- **Output**: HTML checklist de seguridad NOM-004-STPS-1999

### 5. Consejo de Operador (`getOperatorAdvice`)
- **Modelo**: `gemini-2.5-flash`
- **Input**: categoría + notas del operador
- **Output**: 2 frases de acción inmediata en español mexicano

---

## 👥 Roles de Usuario

| Rol | Acceso |
|---|---|
| `admin` | Acceso total |
| `planner` | Dashboard, Activos, Mantenimiento |
| `technician` | Panel de servicio, Activos |
| `viewer` | Solo lectura |

---

## 🧪 Testing

```bash
npm test          # Tests unitarios
npm run lint      # ESLint
npm run build     # Verificación de build
```

---

## 📋 Origen de Componentes

| Archivo | Fuente Principal | Mejoras Integradas |
|---|---|---|
| `gemini.service.ts` | `main` (Gemini 2.5) | `getAi()` helper de Edithion, `analyzeImage` extendido de Edithion |
| `auth.service.ts` | `Corporate-Edition` (signals + NgZone) | Roles y `syncUserProfile` de Edithion |
| `types.ts` | `main` (más completo) | `UserProfile` de Edithion |
| `app.component.ts` | `Corporate-Edition` (UI signals) | Vistas `inventory` y `work-orders` de Edithion |
| `data.service.ts` | `Corporate-Edition` (RTDB sync) | Métodos de simulación de `main` |

---

## 📝 Changelog

### v1.0.0 — Advanced Release
- ✅ Fusión de los 3 repositorios AssetGuard
- ✅ Gemini 2.5 Flash con 5 métodos de IA
- ✅ `getAi()` helper seguro para manejo de API key
- ✅ Auth fusionado: Email + Google OAuth + Demo + Roles
- ✅ Tipos unificados con `UserProfile` y campos extendidos
- ✅ Componentes `Inventory` y `WorkOrders` integrados
- ✅ Panel AI con sanitización DOMPurify
- ✅ README completo con arquitectura y guía de instalación

---

## 🏢 Contexto del Proyecto

Sistema CMMS (Computerized Maintenance Management System) para gestión de montacargas y activos industriales en entorno Toyota/FEMSA. Diseñado para:
- Plantas de distribución con flota mixta (eléctrico, gas LP, diesel)
- Equipos de mantenimiento predictivo
- Gerencia de operaciones (reportes ejecutivos)
- Operadores de planta (reporte de fallas móvil)

---

*Desarrollado por **Joseluiscruz-hub** — AssetGuard Corporate Edition Advanced 2026*

<!-- Deploy trigger: added Firebase secrets -->


<!-- Deploy trigger: added Firebase secrets -->
