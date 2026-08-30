import { Component, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';
import { EstadoRefaccion, ForkliftFailureEntry } from '../types';

const ESTADO_CONFIG = {
  [EstadoRefaccion.NO_APLICA]: {
    label: 'N/A (Solo M.O.)',
    color: 'gray',
    icon: '➖'
  },
  [EstadoRefaccion.EN_STOCK]: {
    label: 'En Stock',
    color: 'green',
    icon: '✅'
  },
  [EstadoRefaccion.PEDIDA]: {
    label: 'Pedida',
    color: 'blue',
    icon: '📦'
  },
  [EstadoRefaccion.POR_RECIBIR]: {
    label: 'Por Recibir',
    color: 'blue',
    icon: '🚚'
  },
  [EstadoRefaccion.COTIZANDO]: {
    label: 'Cotizando',
    color: 'yellow',
    icon: '💰'
  },
  [EstadoRefaccion.APROBACION_PENDIENTE]: {
    label: 'Esperando Aprobación',
    color: 'orange',
    icon: '⏸️'
  },
  [EstadoRefaccion.ORDENADA]: {
    label: 'Pedida a Proveedor',
    color: 'blue',
    icon: '📦'
  },
  [EstadoRefaccion.EN_TRANSITO]: {
    label: 'En Tránsito',
    color: 'blue',
    icon: '🚚'
  },
  [EstadoRefaccion.RECIBIDA]: {
    label: 'Recibida en Almacén',
    color: 'purple',
    icon: '📥'
  },
  [EstadoRefaccion.ENTREGADA_TECNICO]: {
    label: 'En Poder del Técnico',
    color: 'green',
    icon: '🔧'
  }
};

@Component({
  selector: 'app-service-panel',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-orange-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
          <i
            class="fas fa-wrench absolute -right-4 -bottom-4 text-8xl text-orange-700 opacity-50"
          ></i>
          <p class="text-xs uppercase font-bold text-orange-100">Unidades en Taller</p>
          <p class="text-4xl font-black mt-2">{{ openFailures().length }}</p>
        </div>

        <div
          class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center"
        >
          <p class="text-xs uppercase font-bold text-slate-400">Refacciones Pendientes</p>
          <p class="text-3xl font-black text-slate-700 dark:text-white mt-1">{{ pendingParts() }}</p>
        </div>

        <div
          class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center"
        >
          <p class="text-xs uppercase font-bold text-slate-400">Prioridad Alta</p>
          <p class="text-3xl font-black text-red-500 mt-1">{{ criticalCount() }}</p>
        </div>
      </div>

      <!-- Main Content -->
      <div
        class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[500px]"
      >
        <div class="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h3 class="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-sm">
            Órdenes de Trabajo Activas
          </h3>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-700">
          <div *ngFor="let f of openFailures(); let i = index; trackBy: trackById" class="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <!-- Top Row: ID + Status -->
              <div
                class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg"
                  >
                    {{ f.economico.slice(-3) }}
                  </div>
                  <div>
                    <h4 class="font-black text-xl text-slate-800 dark:text-white">{{ f.economico }}</h4>
                    <p class="text-xs text-slate-500">{{ f.fechaIngreso | date: 'medium' }}</p>
                  </div>
                </div>

                <div class="flex gap-2">
                  <span
                    [class]="
                      'px-3 py-1 rounded text-xs font-bold uppercase ' +
                      (f.prioridad === 'Alta'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-600')
                    "
                  >
                    {{ f.prioridad }}
                  </span>
                  <span
                    class="px-3 py-1 rounded text-xs font-bold uppercase bg-blue-100 text-blue-700"
                  >
                    {{ f.estatus }}
                  </span>
                </div>
              </div>

              <!-- Diagnosis & Form -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left: Diagnosis -->
                <div class="lg:col-span-1">
                  <p class="text-xs font-bold text-slate-400 uppercase mb-2">
                    Diagnóstico Reportado
                  </p>
                  <div
                    class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 font-medium"
                  >
                    {{ f.falla }}
                  </div>

                  <!-- SLA Countdown -->
                  <div class="mt-4">
                    <p class="text-xs font-bold text-slate-400 uppercase mb-2">SLA Activo</p>
                    <div *ngIf="f?.sla" [ngClass]="getSLAClasses(f.sla)" class="text-center px-4 py-2 rounded-lg">
                      <p class="text-xs font-semibold uppercase">
                        {{ f.sla.estado || 'En Tiempo' }}
                      </p>
                      <p class="text-2xl font-bold">
                        {{ f.sla.tiempoRestante || '24h' }}
                      </p>
                      <p class="text-xs">
                        Límite: {{ f.sla.horaLimite ? (f.sla.horaLimite | date:'HH:mm') : '18:00' }}
                      </p>
                      <div class="w-24 h-1 bg-gray-200 rounded-full mt-2">
                        <div class="h-1 rounded-full transition-all"
                             [ngClass]="getSLAProgressColor(f.sla)"
                             [style.width.%]="f.sla.porcentajeTranscurrido || 50"></div>
                      </div>
                    </div>
                    <div *ngIf="!f?.sla" class="text-center px-4 py-2 rounded-lg bg-green-100 border-2 border-green-500 text-green-800">
                      <p class="text-xs font-semibold uppercase">En Tiempo</p>
                      <p class="text-2xl font-bold">24h</p>
                      <p class="text-xs">Límite: 18:00</p>
                      <div class="w-24 h-1 bg-gray-200 rounded-full mt-2">
                        <div class="h-1 rounded-full transition-all bg-green-500" [style.width.%]="50"></div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-4">
                    <p class="text-xs font-bold text-slate-400 uppercase mb-2">Historial Técnico</p>
                    <div class="space-y-2 max-h-32 overflow-y-auto custom-scroll text-xs">
                      <div *ngFor="let msg of f.seguimiento; trackBy: trackByMsgFecha" class="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-slate-300">
                        <span class="font-bold text-orange-600">{{ msg.usuario }}:</span>
                        {{ msg.mensaje }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Middle: Logistics -->
                <div class="lg:col-span-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h5 class="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <i class="fas fa-box-open"></i> Logística de Refacciones
                  </h5>

                  <!-- Estado Refacción -->
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Estado Refacción</label>
                    <select [(ngModel)]="f.estatusRefaccion"
                            [ngClass]="getEstadoClasses(f.estatusRefaccion)"
                            class="w-full rounded px-3 py-2 bg-white dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600">
                      <option *ngFor="let estado of estadosRefaccion"
                              [value]="estado">
                        {{ estadoConfig[estado].icon }} {{ estadoConfig[estado].label }}
                      </option>
                    </select>

                    <!-- Información adicional según estado -->
                    <div *ngIf="f.estatusRefaccion === EstadoRefaccion.EN_TRANSITO"
                         class="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <div class="flex items-center justify-between">
                        <span class="text-gray-700">Fecha estimada llegada:</span>
                        <input *ngIf="f?.fechaEstimadaLlegada !== undefined" type="date"
                               [(ngModel)]="f.fechaEstimadaLlegada"
                               class="text-sm border rounded px-2 py-1">
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        {{ calcularDiasRestantes(f.fechaEstimadaLlegada) }} días restantes
                      </p>
                    </div>

                    <div *ngIf="f.estatusRefaccion === EstadoRefaccion.APROBACION_PENDIENTE"
                         class="mt-2 p-2 bg-orange-50 rounded text-sm">
                      <p class="text-orange-800 font-medium mb-2">
                        Esperando aprobación de compra
                      </p>
                      <div class="flex gap-2">
                        <button class="flex-1 bg-green-500 text-white px-3 py-1 rounded text-xs"
                                (click)="aprobarCompra(f)">
                          ✓ Aprobar
                        </button>
                        <button class="flex-1 bg-red-500 text-white px-3 py-1 rounded text-xs"
                                (click)="rechazarCompra(f)">
                          ✕ Rechazar
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Refacción específica -->
                  <div class="refaccion-section mt-4">
                    <label class="block text-sm font-medium mb-1">Refacción Requerida</label>

                    <!-- Autocomplete con búsqueda -->
                    <div class="relative">
                      <input type="text"
                             [(ngModel)]="busquedaRefaccion"
                             (input)="buscarRefacciones($event)"
                             placeholder="Buscar por código o descripción..."
                             class="w-full border rounded px-3 py-2 pr-10 bg-white dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600">

                      <!-- Resultados autocomplete -->
                      <div *ngIf="resultadosBusqueda.length > 0" class="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div *ngFor="let refaccion of resultadosBusqueda; trackBy: trackByRefaccion" (click)="seleccionarRefaccion(f, refaccion)" class="px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b dark:border-slate-700 dark:text-slate-200">
                          <div class="flex justify-between items-start">
                            <div>
                              <p class="font-semibold text-sm">{{ refaccion.codigo }}</p>
                              <p class="text-xs text-gray-600">{{ refaccion.descripcion }}</p>
                            </div>
                            <div class="text-right">
                              <p class="text-sm font-bold text-green-600">
                                {{ '$' }}{{ refaccion.precio }}
                              </p>
                              <p class="text-xs" [ngClass]="refaccion.stock > 0 ? 'text-green-600' : 'text-red-600'">
                                {{ refaccion.stock > 0 ? 'En stock: ' + refaccion.stock : 'Agotado' }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Refacciones seleccionadas -->
                    <div *ngIf="f.refacciones && f.refacciones.length > 0" class="mt-3 space-y-2">
                      <div *ngFor="let ref of f.refacciones; trackBy: trackByRefIndex; let i = index" class="bg-gray-50 dark:bg-slate-800 p-3 rounded flex justify-between items-center dark:text-slate-200">
                        <div class="flex-1">
                          <p class="font-semibold text-sm">{{ ref.codigo }}</p>
                          <p class="text-xs text-gray-600">{{ ref.descripcion }}</p>
                          <div class="flex gap-4 mt-1">
                            <span class="text-xs">Cant: {{ ref.cantidad }}</span>
                            <span class="text-xs">Precio: {{ '$' }}{{ ref.precio }}</span>
                            <span class="text-xs font-bold">Total: {{ '$' }}{{ ref.cantidad * ref.precio }}</span>
                          </div>
                        </div>
                        <button (click)="eliminarRefaccion(f, i)" class="text-red-500 hover:text-red-700 ml-2">
                          Eliminar
                        </button>
                      </div>
                      <div class="bg-indigo-50 p-3 rounded flex justify-between items-center">
                        <span class="font-bold">TOTAL REFACCIONES:</span>
                        <span class="text-xl font-bold text-indigo-600">
                          {{ '$' }}{{ calcularTotalRefacciones(f) }}
                        </span>
                      </div>
                    </div>
                    <div *ngIf="!f.refacciones || f.refacciones.length === 0" class="mt-3 p-3 bg-gray-50 dark:bg-slate-800 rounded">
                      <p class="text-center text-sm text-gray-500">Sin refacciones seleccionadas. Utiliza la búsqueda para agregar refacciones.</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label class="text-xs font-bold text-slate-400 uppercase"
                        >Orden de Compra (PO)</label
                      >
                      <input
                        type="text"
                        #po
                        [value]="f.ordenCompra || ''"
                        class="w-full mt-1 p-2 rounded border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex gap-2 mt-4">
                    <input
                      #note
                      type="text"
                      placeholder="Agregar nota técnica..."
                      class="flex-1 p-2 rounded border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-900 dark:text-slate-200"
                    />
                    <button
                      (click)="addNote(f.id, note.value); note.value = ''"
                      class="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded text-xs hover:bg-slate-300 transition"
                    >
                      <i class="fas fa-comment"></i>
                    </button>
                  </div>

                  <div class="flex gap-3 mt-4 pt-4 border-t border-slate-200">
                    <button
                      (click)="saveLogistics(f.id, po.value, f.estatusRefaccion || EstadoRefaccion.NO_APLICA)"
                      class="flex-1 py-2 bg-slate-800 text-white rounded font-bold text-xs uppercase hover:bg-slate-900 transition"
                    >
                      Guardar Cambios
                    </button>
                    <button
                      (click)="closeTicket(f.id)"
                      class="px-6 py-2 bg-green-600 text-white rounded font-bold text-xs uppercase hover:bg-green-700 transition"
                    >
                      Liberar
                    </button>
                  </div>
                </div>
              </div>
          </div>

          <div *ngIf="openFailures().length === 0" class="py-20 text-center">
            <div
              class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 mb-4"
            >
              <i class="fas fa-check text-4xl"></i>
            </div>
            <h3 class="font-bold text-slate-600 dark:text-slate-300">Todo limpio</h3>
            <p class="text-slate-400 text-sm">No hay unidades pendientes en taller.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ServicePanelComponent {
  dataService = inject(DataService);

  openFailures = computed(() =>
  this.dataService.forkliftFailures()
    .filter(f => f.estatus !== 'Cerrada')
    .map(f => ({
      ...f,
      sla: f.sla || {},
      fechaEstimadaLlegada: f.fechaEstimadaLlegada || '',
      refacciones: f.refacciones || []
    }))
);

  pendingParts = computed(
    () =>
      this.dataService.forkliftFailures().filter(
        f =>
          f.estatusRefaccion === EstadoRefaccion.ORDENADA ||
          f.estatusRefaccion === EstadoRefaccion.PEDIDA
      ).length
  );

  criticalCount = computed(
    () =>
      this.dataService
        .forkliftFailures()
        .filter(f => f.prioridad === 'Alta' && f.estatus !== 'Cerrada').length
  );

  saveLogistics(id: string, po: string, status: EstadoRefaccion) {
    this.dataService.updateCorporateLogistics(id, po, status);
  }

  addNote(id: string, note: string) {
    if (!note) return;
    this.dataService.addFailureUpdate(id, note, 'ORSTED CORP Tech');
  }

  closeTicket(id: string) {
    if (confirm('¿Confirmar liberación de equipo?')) {
      this.dataService.closeLiveFailure(id);
    }
  }

  // Exponer EstadoRefaccion y estadoConfig como propiedades públicas
  public EstadoRefaccion = EstadoRefaccion;
  public estadoConfig = ESTADO_CONFIG;

  get estadosRefaccion() {
    return Object.values(EstadoRefaccion);
  }

  busquedaRefaccion = '';
  resultadosBusqueda: Array<{ codigo: string; descripcion: string; precio: number; stock: number }> = [];

  // Mock catálogo de refacciones
  catalogoRefacciones = [
    { codigo: 'FLT-001', descripcion: 'Filtro de aceite hidráulico', precio: 45.50, stock: 12 },
    { codigo: 'FLT-002', descripcion: 'Filtro de combustible', precio: 32.00, stock: 8 },
    { codigo: 'BRK-001', descripcion: 'Pastillas de freno delantero', precio: 85.00, stock: 0 },
    { codigo: 'BRK-002', descripcion: 'Disco de freno', precio: 120.00, stock: 5 },
    { codigo: 'BAT-001', descripcion: 'Batería 12V 100Ah', precio: 180.00, stock: 3 }
  ];

  buscarRefacciones(event: Event) {
    const target = event.target as HTMLInputElement;
    const query = target.value.toLowerCase();
    if (query.length < 2) {
      this.resultadosBusqueda = [];
      return;
    }
    this.resultadosBusqueda = this.catalogoRefacciones.filter(ref =>
      ref.codigo.toLowerCase().includes(query) ||
      ref.descripcion.toLowerCase().includes(query)
    );
  }

  seleccionarRefaccion(failure: ForkliftFailureEntry, refaccion: { codigo: string; descripcion: string; precio: number; stock: number }) {
    if (!failure.refacciones) failure.refacciones = [];
    const existing = failure.refacciones.find((r: { codigo: string }) => r.codigo === refaccion.codigo);
    if (existing) {
      existing.cantidad += 1;
    } else {
      failure.refacciones.push({
        ...refaccion,
        cantidad: 1
      });
    }
    this.busquedaRefaccion = '';
    this.resultadosBusqueda = [];
  }

  eliminarRefaccion(failure: ForkliftFailureEntry, index: number) {
    if (!failure.refacciones) return;
    failure.refacciones.splice(index, 1);
  }

  calcularTotalRefacciones(failure: ForkliftFailureEntry): number {
    if (!failure.refacciones) return 0;
    return failure.refacciones.reduce((total: number, ref: { cantidad: number; precio: number }) => total + (ref.cantidad * ref.precio), 0);
  }

  calcularDiasRestantes(fecha: string): number {
    if (!fecha) return 0;
    const hoy = new Date();
    const llegada = new Date(fecha);
    const diff = llegada.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  aprobarCompra(failure: ForkliftFailureEntry) {
    failure.estatusRefaccion = EstadoRefaccion.ORDENADA;
    alert('[DEMO] Compra aprobada');
  }

  rechazarCompra(failure: ForkliftFailureEntry) {
    failure.estatusRefaccion = EstadoRefaccion.COTIZANDO;
    alert('[DEMO] Compra rechazada');
  }

  // Corrijo el método getEstadoClasses para castear el estado a keyof typeof ESTADO_CONFIG
  getEstadoClasses(estado: string | undefined) {
    return estado && this.estadoConfig[estado as keyof typeof ESTADO_CONFIG]?.color
      ? this.estadoConfig[estado as keyof typeof ESTADO_CONFIG].color
      : 'bg-gray-200';
  }

  getSLAClasses(sla: { porcentajeTranscurrido?: number } | null): string {
    if (!sla) return 'bg-green-100 border-2 border-green-500 text-green-800';
    if (sla.porcentajeTranscurrido && sla.porcentajeTranscurrido >= 100) {
      return 'bg-red-100 border-2 border-red-500 text-red-800';
    }
    if (sla.porcentajeTranscurrido && sla.porcentajeTranscurrido >= 80) {
      return 'bg-orange-100 border-2 border-orange-500 text-orange-800';
    }
    return 'bg-green-100 border-2 border-green-500 text-green-800';
  }

  getSLAProgressColor(sla: { porcentajeTranscurrido?: number } | null): string {
    if (!sla) return 'bg-green-500';
    if (sla.porcentajeTranscurrido && sla.porcentajeTranscurrido >= 100) return 'bg-red-500';
    if (sla.porcentajeTranscurrido && sla.porcentajeTranscurrido >= 80) return 'bg-orange-500';
    return 'bg-green-500';
  }

  trackById(index: number, item: ForkliftFailureEntry): string {
    return item.id;
  }

  trackByMsgFecha(index: number, item: { fecha: string }): string {
    return item.fecha;
  }

  trackByRefaccion(index: number, item: { codigo: string }): string {
    return item.codigo;
  }

  trackByRefIndex(_index: number, _item: any): number {
    return _index;
  }
}
