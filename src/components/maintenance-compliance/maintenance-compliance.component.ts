// maintenance-compliance.component.ts — Programa SMP
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-maintenance-compliance',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center border-l-4 border-l-emerald-500">
          <p class="text-xs text-slate-500 uppercase font-bold">Completados</p>
          <p class="text-3xl font-black text-emerald-600">{{ stats().completed }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center border-l-4 border-l-amber-500">
          <p class="text-xs text-slate-500 uppercase font-bold">Programados</p>
          <p class="text-3xl font-black text-amber-600">{{ countByStatus('Programado') }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center border-l-4 border-l-red-500">
          <p class="text-xs text-slate-500 uppercase font-bold">Vencidos</p>
          <p class="text-3xl font-black text-red-600">{{ countByStatus('Vencido') }}</p>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
        <div class="flex-1 bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
          <div class="bg-emerald-500 h-full rounded-full transition-all" [style.width.%]="stats().percentage"></div>
        </div>
        <span class="font-black text-lg text-slate-800 dark:text-white">{{ stats().percentage }}%</span>
        <span class="text-xs text-slate-400 uppercase font-bold">Cumplimiento SMP</span>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 class="font-bold text-slate-800 dark:text-white">Programa Sistemático de Mantenimiento — Feb 2026</h3>
          <p class="text-xs text-slate-400 mt-0.5">Supervisor: AARON VELAZQUEZ · Toyota Material Handling México</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="p-3">Económico</th>
                <th class="p-3">Modelo</th>
                <th class="p-3">SMP</th>
                <th class="p-3">Técnico</th>
                <th class="p-3">Fecha</th>
                <th class="p-3">OT Folio</th>
                <th class="p-3 text-center">Estatus</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              @for (item of dataService.maintenanceSchedule(); track item.id) {
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td class="p-3 font-bold text-slate-800 dark:text-white font-mono text-xs">{{ item.economico }}</td>
                  <td class="p-3 text-slate-600 dark:text-slate-300 text-xs">{{ item.model }}</td>
                  <td class="p-3">
                    <span class="text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{{ item.smpType }}</span>
                  </td>
                  <td class="p-3 text-slate-600 dark:text-slate-300 text-xs">{{ item.technician }}</td>
                  <td class="p-3 text-xs text-slate-500">{{ item.scheduledDate | date:'dd/MM/yy' }}</td>
                  <td class="p-3 text-xs font-mono text-slate-400">{{ item.otFolio }}</td>
                  <td class="p-3 text-center">
                    <span [class]="'text-xs font-bold px-2 py-0.5 rounded-full border ' + getStatusClass(item.status)">
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class MaintenanceComplianceComponent {
  dataService = inject(DataService);
  stats = this.dataService.complianceStats;

  countByStatus(status: string) {
    return this.dataService.maintenanceSchedule().filter(s => s.status === status).length;
  }
  getStatusClass(status: string) {
    switch(status) {
      case 'Completado': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'Vencido':    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default:           return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
    }
  }
}
