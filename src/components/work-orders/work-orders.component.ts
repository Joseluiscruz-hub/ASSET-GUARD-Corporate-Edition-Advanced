// =======================================================================================
// work-orders.component.ts — AssetGuard Corporate Edition Advanced
// Gestión de órdenes de trabajo (OT) para mantenimiento correctivo y preventivo.
// =======================================================================================

import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-work-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 bg-slate-50 min-h-screen">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-600">engineering</span>
            Órdenes de Trabajo
          </h1>
          <p class="text-slate-500">Programación y seguimiento de reparaciones</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95">
            <span class="material-symbols-outlined">add</span>
            Crear OT Manual
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
        <button 
          *ngFor="let tab of tabs" 
          (click)="activeTab.set(tab.id)"
          [class]="activeTab() === tab.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'"
          class="px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border border-transparent"
        >
          {{ tab.label }}
          <span class="ml-1 opacity-60 text-xs">{{ tab.count }}</span>
        </button>
      </div>

      <!-- List -->
      <div class="grid grid-cols-1 gap-4">
        <div 
          *ngFor="let ot of filteredOrders()" 
          class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-all group"
        >
          <div class="flex flex-col md:flex-row gap-6">
            <!-- OT ID & Icon -->
            <div class="flex-shrink-0 flex md:flex-col items-center justify-center gap-3 bg-slate-50 rounded-xl px-6 py-4 border border-slate-100">
              <span class="material-symbols-outlined text-3xl" [class.text-amber-500]="ot.tipo === 'Correctivo'" [class.text-indigo-500]="ot.tipo === 'Preventivo'">
                {{ ot.tipo === 'Correctivo' ? 'warning' : 'event_available' }}
              </span>
              <div class="text-center">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Folio</div>
                <div class="text-lg font-black text-slate-900 leading-none">#{{ ot.id }}</div>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase">{{ ot.tipo }}</span>
                <span [class]="getPriorityClass(ot.prioridad)" class="px-3 py-1 rounded-full text-[10px] font-bold uppercase">{{ ot.prioridad }}</span>
                <span class="text-slate-400 text-sm ml-auto font-mono">{{ ot.fecha | date:'short' }}</span>
              </div>
              
              <h3 class="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{{ ot.titulo }}</h3>
              <p class="text-slate-500 text-sm mb-4">{{ ot.descripcion }}</p>

              <div class="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-50">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-slate-400 text-lg">forklift</span>
                  <span class="text-sm font-bold text-slate-700">{{ ot.unidad }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-slate-400 text-lg">person</span>
                  <span class="text-sm text-slate-600">{{ ot.tecnico }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-slate-400 text-lg">history</span>
                  <span class="text-sm text-slate-600">{{ ot.tiempoEstimado }} est.</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex md:flex-col justify-end gap-2">
              <button class="bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 px-4 py-2 rounded-xl text-sm font-bold transition-all">Ver Detalle</button>
              <button class="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">Atender</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class WorkOrdersComponent {
  private dataService = inject(DataService);
  
  activeTab = signal('all');
  tabs = [
    { id: 'all', label: 'Todas', count: 12 },
    { id: 'pending', label: 'Pendientes', count: 5 },
    { id: 'progress', label: 'En Proceso', count: 3 },
    { id: 'completed', label: 'Completadas', count: 4 },
  ];

  orders = signal<any[]>([
    { id: '4550', titulo: 'Fuga de aceite en mástil', descripcion: 'El operador reporta goteo persistente después de 2 horas de uso intenso.', unidad: 'CUA-35526', tecnico: 'Maycol Martinez', prioridad: 'Alta', tipo: 'Correctivo', estatus: 'pending', fecha: new Date() },
    { id: '4551', titulo: 'Mantenimiento SMP 250h', descripcion: 'Cambio de filtros y revisión de sistema eléctrico según programa.', unidad: 'CUA-35528', tecnico: 'Ariel Alavez', prioridad: 'Media', tipo: 'Preventivo', estatus: 'progress', fecha: new Date(Date.now() - 3600000) },
    { id: '4552', titulo: 'Cambio de neumáticos traseros', descripcion: 'Desgaste excesivo detectado en checklist matutino.', unidad: 'CUA-35530', tecnico: 'Sin Asignar', prioridad: 'Baja', tipo: 'Correctivo', estatus: 'pending', fecha: new Date(Date.now() - 7200000) },
  ]);

  filteredOrders = computed(() => {
    if (this.activeTab() === 'all') return this.orders();
    return this.orders().filter(o => o.estatus === this.activeTab());
  });

  getPriorityClass(p: string): string {
    switch (p) {
      case 'Alta': return 'bg-rose-100 text-rose-700';
      case 'Media': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }
}
