import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-work-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 animate-fade-in pb-20">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Gestión de Mantenimiento</span>
          </div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display">Órdenes de Trabajo</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Planificación, ejecución y cierre de actividades técnicas</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button class="bg-corporate-dark text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl transition-all hover:bg-femsa-red active:scale-95 text-xs font-black uppercase tracking-widest">
            <i class="fas fa-file-signature text-femsa-red"></i>
            Generar OT Manual
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
        <button 
          *ngFor="let tab of tabs" 
          (click)="activeTab.set(tab.id)"
          [class]="activeTab() === tab.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl scale-105' : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5'"
          class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3"
        >
          {{ tab.label }}
          <span class="px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-[9px]">{{ tab.count }}</span>
        </button>
      </div>

      <!-- List -->
      <div class="grid grid-cols-1 gap-6">
        <div 
          *ngFor="let ot of filteredOrders()" 
          class="bg-white dark:bg-white/5 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-none hover:border-femsa-red/30 transition-all group relative overflow-hidden"
        >
          <!-- Background accent -->
          <div class="absolute top-0 right-0 w-32 h-32 bg-femsa-red/5 rounded-full blur-3xl -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div class="flex flex-col md:flex-row gap-8 relative z-10">
            <!-- OT ID & Status Visual -->
            <div class="flex-shrink-0 flex md:flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-white/5 rounded-[24px] px-8 py-6 border border-slate-100 dark:border-white/5">
              <div class="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-2xl" [class.text-femsa-red]="ot.tipo === 'Correctivo'" [class.text-blue-500]="ot.tipo === 'Preventivo'">
                <i [class]="ot.tipo === 'Correctivo' ? 'fas fa-exclamation-triangle' : 'fas fa-calendar-check'"></i>
              </div>
              <div class="text-center">
                <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Folio OT</div>
                <div class="text-xl font-black text-slate-900 dark:text-white leading-none">#{{ ot.id }}</div>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-3 mb-4">
                <span class="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">{{ ot.tipo }}</span>
                <span [class]="getPriorityClass(ot.prioridad)" class="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border">{{ ot.prioridad }}</span>
                <div class="ml-auto flex items-center gap-2 text-[10px] font-bold text-slate-400">
                   <i class="far fa-clock"></i>
                   {{ ot.fecha | date:'dd MMM, HH:mm' }}
                </div>
              </div>
              
              <h3 class="text-xl font-black text-slate-900 dark:text-white group-hover:text-femsa-red transition-colors mb-2">{{ ot.titulo }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{{ ot.descripcion }}</p>

              <div class="flex flex-wrap items-center gap-8 mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <i class="fas fa-truck-monster"></i>
                  </div>
                  <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unidad</p>
                    <p class="text-xs font-black text-slate-900 dark:text-white">{{ ot.unidad }}</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <i class="fas fa-user-gear"></i>
                  </div>
                  <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Técnico</p>
                    <p class="text-xs font-black text-slate-900 dark:text-white">{{ ot.tecnico }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <i class="fas fa-hourglass-half"></i>
                  </div>
                  <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">SLA Estimado</p>
                    <p class="text-xs font-black text-slate-900 dark:text-white">{{ ot.tiempoEstimado }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex md:flex-col justify-end gap-3">
              <button class="px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Detalle</button>
              <button class="px-6 py-3 bg-femsa-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-femsa-red/20 active:scale-95">Gestionar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class WorkOrdersComponent {
  private dataService = inject(DataService);
  
  activeTab = signal('all');
  
  tabs = computed(() => [
    { id: 'all', label: 'Historial Completo', count: this.dataService.workOrders().length },
    { id: 'pending', label: 'Pendientes', count: this.dataService.workOrders().filter(o => o.estatus === 'pending').length },
    { id: 'progress', label: 'En Ejecución', count: this.dataService.workOrders().filter(o => o.estatus === 'progress').length },
    { id: 'completed', label: 'Finalizadas', count: this.dataService.workOrders().filter(o => o.estatus === 'completed').length },
  ]);

  filteredOrders = computed(() => {
    const orders = this.dataService.workOrders();
    if (this.activeTab() === 'all') return orders;
    return orders.filter(o => o.estatus === this.activeTab());
  });

  getPriorityClass(p: string): string {
    switch (p) {
      case 'Alta': return 'bg-femsa-red/10 text-femsa-red border-femsa-red/20';
      case 'Media': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  }
}
