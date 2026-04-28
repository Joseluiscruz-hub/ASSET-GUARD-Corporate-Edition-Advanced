// =============================================================================
// types.ts — AssetGuard Corporate Edition Advanced
// Fusión de los 3 repositorios. Fuente principal: Corporate-Edition-main
// Campos adicionales: UserProfile (de Edithion), subcomponent/context_analysis (AIInspectionResponse extendida)
// =============================================================================

// --- AUTENTICACIÓN Y PERFILES (de Edithion) ---

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'planner' | 'technician' | 'viewer';
}

// --- ACTIVOS ---

export interface Status {
  id: string;
  name: 'Operativo' | 'Taller' | 'Baja' | 'Preventivo';
  color: string; // Tailwind class or Hex
  hex: string;
}

export interface MaintenanceTask {
  id: string;
  date: string;
  description: string;
  status: 'Pending' | 'Overdue' | 'Completed';
}

export interface Operator {
  name: string;
  role: string;
  shift: string;
}

export interface Asset {
  id: string;            // Economic ID (e.g., 35526)
  brand: string;
  model: string;
  serial: string;
  sapCode?: string;      // SAP Code
  acquisitionDate: string;
  fuelType: 'Eléctrico' | 'Gas LP' | 'Diesel' | 'GLP/Gasolina Dual';
  status: Status;
  statusSince: string;   // ISO Date

  image?: string;

  // Location & Classification
  location: string;      // Ubicacion (e.g. Pasillo 4)
  lastFailure?: string;  // Description of last failure
  critical: boolean;     // Priority flag

  // Real Data Integration
  assignedOperators?: Operator[];
  supervisor?: string;
  operatingHours?: number;

  // HACCP / Food Safety Integration
  cleanlinessStatus: 'Sanitized' | 'Pending' | 'Critical';
  lastSanitization?: string; // ISO Date

  // Scheduled Maintenance
  maintenanceTasks?: MaintenanceTask[];
}

// --- FALLAS ---

export interface FailureReport {
  id: string;
  assetId: string;
  entryDate: string;        // ISO Date
  exitDate?: string | null; // ISO Date or null
  failureDescription: string;
  diagnosis?: string;
  partsUsed: string[];
  estimatedCost: number;
  technician: string;
  type: 'Eléctrico' | 'Mecánico' | 'Hidráulico' | 'Operador' | 'Llantas' | 'Estructural' | 'Software';
}

// --- KPIs ---

export interface KPIData {
  availability: number;   // Percentage
  mttr: number;           // Hours
  totalCostMonth: number;
  budgetMonth: number;
}

// --- TRACKING BIDIRECCIONAL ---

export interface FailureUpdate {
  usuario: string;  // "Planta" or "Toyota"
  mensaje: string;
  fecha: string;    // ISO Date
}

// --- AUDIT LOG (Live Panel) ---

export interface ForkliftFailureEntry {
  id: string;
  economico: string;
  falla: string;
  reporta: string;
  fechaIngreso: string;
  fechaSalida?: string;           // Added for closing workflow
  prioridad: 'Alta' | 'Media' | 'Baja';
  estatus: 'Abierta' | 'En Proceso' | 'Cerrada';
  seguimiento: FailureUpdate[];   // Historial de interacción

  // Toyota Management Fields
  ordenCompra?: string;
  estatusRefaccion?: 'N/A' | 'En Stock' | 'Pedida' | 'Por Recibir';
  fechaPromesa?: string;          // ISO Date for expected parts
}

// --- AI INSPECTION RESPONSE (extendida — fusión main + Edithion) ---

export interface AIInspectionResponse {
  inspection: {
    timestamp: string;
    asset: {
      component_affected: string;
      subcomponent?: string;           // Edithion: subcomponente específico
      visual_condition: string;
      context_analysis?: string;       // Edithion: análisis del entorno
    };
    damage_analysis: {
      damage_type: string;
      visible_signs: string[];
      affected_area_percentage: string;
      technical_description?: string;  // Edithion: descripción técnica profunda
    };
    severity: {
      level: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
      risk_score: string;
      safety_impact: string;
      operational_impact: string;
      environmental_impact?: string;   // Edithion: riesgo de contaminación
    };
    root_cause_analysis: {
      probable_cause: string;
      why_analysis: string | string[]; // string (main) o string[] (Edithion 5-Why)
      contributing_factors?: string[]; // Edithion: factores externos
    };
    immediate_actions: {
      safety_measures: string[];
      containment_actions?: string[];  // Edithion: para evitar que el daño progrese
    };
    repair_plan: {
      estimated_parts: Array<{
        part_name: string;
        generic_code: string;
        quantity: string;
        criticality?: string;          // Edithion: Alta/Media/Baja
      }>;
      estimated_mttr_hours: string;
      estimated_cost_usd: { min: number; max: number };
      recommended_specialists?: string[]; // Edithion: tipo de técnico requerido
    };
    image_quality_warning?: string;    // Aviso si la imagen no es clara
  };
}

// --- ESTADO DE REFACCION (Enum) ---

export enum EstadoRefaccion {
  NO_APLICA  = 'N/A',
  EN_STOCK   = 'En Stock',
  PEDIDA     = 'Pedida',
  POR_RECIBIR = 'Por Recibir',
}

// --- PROGRAMA DE MANTENIMIENTO SISTEMÁTICO ---

export interface MaintenanceSchedule {
  id: string;
  model: string;
  serial: string;
  economico: string;
  supervisor: string;
  smpType: 'X' | 'Y' | 'Z' | 'REV';
  scheduledDate: string;     // ISO Date
  realDate?: string;         // ISO Date (cuándo se ejecutó realmente)
  duration: string;          // Duración estimada (e.g. "2hrs")
  otFolio: string;           // Folio de Orden de Trabajo Toyota (MXOT...)
  serviceOrder: string;      // Orden de servicio interna
  hourMeter?: number;        // Horómetro al momento del servicio
  technician: string;
  status: 'Programado' | 'Completado' | 'Vencido';
  history: string[];
  comments: string;
}

// --- REMOZAMIENTO (Pintura y Estética) ---

export interface RefurbishmentRecord {
  id: string;
  assetId: string;
  startDate: string;        // ISO Date
  endDate?: string;         // ISO Date
  status: 'Programado' | 'En Proceso' | 'Pintura' | 'Secado' | 'Finalizado';
  technician: string;
  
  // Fotos de evidencia (Base64 para persistencia simple en este demo)
  photoBefore?: string;     
  photoAfter?: string;      
  
  // Checklist de partes (Trazabilidad de desarmado)
  checklist: Array<{
    part: string;
    removed: boolean;
    condition: 'Bueno' | 'Regular' | 'Dañado';
    notes?: string;
  }>;
  
  paintDetails: {
    color: string;
    brand: string;
    batch?: string;
  };
  
  observations: string;
}
