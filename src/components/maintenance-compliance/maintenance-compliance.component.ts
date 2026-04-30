import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-maintenance-compliance',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="space-y-8 animate-fade-in pb-20">
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/5 p-6 shadow-sm flex items-center justify-between group hover:border-emerald-500/30 transition-all">
          <div>
            <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Completados</p>
            <p class="text-3xl font-black text-slate-900 dark:text-white font-display">{{ stats().completed }}</p>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xl">
            <i class="fas fa-check-double"></i>
          </div>
        </div>

        <div class="bg-white dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/5 p-6 shadow-sm flex items-center justify-between group hover:border-amber-500/30 transition-all">
          <div>
            <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Programados</p>
            <p class="text-3xl font-black text-slate-900 dark:text-white font-display">{{ countByStatus('Programado') }}</p>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-xl">
            <i class="fas fa-calendar-alt"></i>
          </div>
        </div>

        <div class="bg-white dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/5 p-6 shadow-sm flex items-center justify-between group hover:border-femsa-red/30 transition-all">
          <div>
            <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Vencidos</p>
            <p class="text-3xl font-black text-slate-900 dark:text-white font-display">{{ countByStatus('Vencido') }}</p>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-femsa-red/10 flex items-center justify-center text-femsa-red text-xl">
            <i class="fas fa-clock"></i>
          </div>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="bg-white dark:bg-white/5 rounded-[32px] border border-slate-200 dark:border-white/5 p-8 shadow-xl shadow-slate-200/10 dark:shadow-none relative overflow-hidden">
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]"></div>
        <div class="relative z-10">
          <div class="flex justify-between items-end mb-6">
            <div>
              <h3 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Status Global de Cumplimiento</h3>
              <p class="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">Target Mensual: 98.5%</p>
            </div>
            <div class="text-right">
              <span class="text-4xl font-black text-emerald-500 font-display">{{ stats().percentage }}%</span>
            </div>
          </div>
          <div class="w-full bg-slate-100 dark:bg-white/5 h-4 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-white/5">
            <div class="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-1000 relative shadow-[0_0_20px_rgba(16,185,129,0.3)]" [style.width.%]="stats().percentage">
              <div class="absolute inset-0 shimmer opacity-30"></div>
            </div>
          </div>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-4 font-bold uppercase tracking-widest">Sincronizado con bases de datos Toyota Material Handling México</p>
        </div>
      </div>

      <!-- Detailed Schedule Table -->
      <div class="bg-white dark:bg-white/5 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden">
        <div class="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 class="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase">Programa Sistemático de Mantenimiento (SMP)</h3>
            <p class="text-xs text-slate-500 mt-1 font-medium italic">Lead Supervisor: Ing. Aaron Velázquez · Región Centro</p>
          </div>
          <button class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-femsa-red hover:text-white dark:hover:bg-femsa-red dark:hover:text-white transition-all shadow-lg active:scale-95">
            Descargar Programa
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                <th class="px-8 py-6">Económico</th>
                <th class="px-8 py-6">Modelo / Configuración</th>
                <th class="px-8 py-6">Tipo de SMP</th>
                <th class="px-8 py-6">Responsable Técnico</th>
                <th class="px-8 py-6">Fecha Programada</th>
                <th class="px-8 py-6">OT Referencia</th>
                <th class="px-8 py-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-white/5">
              @for (item of dataService.maintenanceSchedule(); track item.id) {
                <tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                  <td class="px-8 py-6">
                    <span class="text-sm font-black text-slate-900 dark:text-white group-hover:text-femsa-red transition-colors font-mono">{{ item.economico }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ item.model }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span class="text-[9px] font-black px-2.5 py-1 rounded bg-slate-900 dark:bg-white/10 text-white dark:text-slate-300 uppercase tracking-widest">{{ item.smpType }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[8px] font-black">{{ item.technician.charAt(0) }}</div>
                      <span class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ item.technician }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-xs font-mono text-slate-500 font-bold">{{ item.scheduledDate | date:'dd.MM.yyyy' }}</td>
                  <td class="px-8 py-6 text-xs font-mono text-slate-400 group-hover:text-femsa-red transition-colors">#{{ item.otFolio }}</td>
                  <td class="px-8 py-6 text-center">
                    <span [class]="'text-[9px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest ' + getStatusClass(item.status)">
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
      case 'Completado': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Vencido':    return 'bg-femsa-red/10 text-femsa-red border-femsa-red/20';
      default:           return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  }
}