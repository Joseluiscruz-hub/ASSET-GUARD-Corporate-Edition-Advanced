// service-panel.component.ts — Panel de Servicio Técnico Toyota
import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';
import { ForkliftFailureEntry } from '../types';

@Component({
  selector: 'app-service-panel',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p class="text-xs text-slate-500 uppercase font-bold">Abiertas</p>
          <p class="text-3xl font-black text-red-600">{{ countByStatus('Abierta') }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p class="text-xs text-slate-500 uppercase font-bold">En Proceso</p>
          <p class="text-3xl font-black text-amber-500">{{ countByStatus('En Proceso') }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p class="text-xs text-slate-500 uppercase font-bold">Cerradas Hoy</p>
          <p class="text-3xl font-black text-emerald-600">{{ countByStatus('Cerrada') }}</p>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 class="font-bold text-slate-800 dark:text-white">Órdenes de Servicio Activas</h3>
          <span class="text-xs text-slate-400">Toyota Material Handling México</span>
        </div>
        <div class="divide-y divide-slate-100 dark:divide-slate-700">
          @for (failure of activeFailures(); track failure.id) {
            <div class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="font-black text-slate-800 dark:text-white text-lg">{{ failure.economico }}</span>
                  <span [class]="'ml-2 text-xs font-bold px-2 py-0.5 rounded-full ' + getPriorityClass(failure.prioridad)">{{ failure.prioridad }}</span>
                </div>
                <span class="text-xs text-slate-400">{{ failure.fechaIngreso | date:'dd/MM HH:mm' }}</span>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-300 mb-3">{{ failure.falla }}</p>
              <div class="flex gap-2 flex-wrap">
                @if (failure.estatus !== 'Cerrada') {
                  <button (click)="updateStatus(failure, 'En Proceso')"
                    class="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-bold hover:bg-blue-100 transition border border-blue-200 dark:border-blue-800">
                    Iniciar Reparación
                  </button>
                  <button (click)="updateStatus(failure, 'Cerrada')"
                    class="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold hover:bg-emerald-100 transition border border-emerald-200 dark:border-emerald-800">
                    Cerrar Orden
                  </button>
                }
                @if (failure.ordenCompra) {
                  <span class="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-mono">OC: {{ failure.ordenCompra }}</span>
                }
              </div>
            </div>
          } @empty {
            <div class="py-16 text-center text-slate-400">
              <i class="fas fa-check-circle text-4xl text-emerald-400 mb-3 block"></i>
              <p class="font-bold">Sin órdenes activas</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ServicePanelComponent {
  dataService = inject(DataService);
  activeFailures = () => this.dataService.forkliftFailures().filter(f => f.estatus !== 'Cerrada');

  countByStatus(status: string) {
    return this.dataService.forkliftFailures().filter(f => f.estatus === status).length;
  }
  getPriorityClass(p: string) {
    return p === 'Alta' ? 'bg-red-100 text-red-700' : p === 'Media' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
  }
  updateStatus(failure: ForkliftFailureEntry, status: string) {
    if (status === 'Cerrada') {
      this.dataService.closeLiveFailure(failure.id);
    } else {
      this.dataService.addFailureUpdate(failure.id, 'Reparación iniciada por técnico.', 'Toyota Tech');
    }
  }
}
