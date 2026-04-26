import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-work-orders',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="p-4 md:p-6 max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
            <i class="fas fa-tasks text-[#ce1126]"></i> Tablero Kanban OT
          </h2>
          <p class="text-slate-500 font-medium text-sm mt-1">Gestión visual de tareas de mantenimiento y asignaciones.</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div class="relative w-full sm:w-auto">
            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Buscar OT, Unidad o Técnico..." class="w-full sm:w-64 pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-[#ce1126] outline-none transition shadow-sm text-sm font-medium font-sans">
          </div>
          <button class="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition flex justify-center items-center gap-2 shadow-sm whitespace-nowrap">
            <i class="fas fa-plus"></i> Nueva OT
          </button>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="flex-1 flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 custom-scroll snap-x">
        
        <!-- Column: Por Hacer (Pending) -->
        <div class="flex-1 min-w-[300px] md:min-w-[350px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col max-h-full snap-center shadow-inner">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl shadow-sm">
            <h3 class="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">
              <i class="fas fa-inbox text-slate-400 text-base"></i> Por Hacer
            </h3>
            <span class="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-3 py-1 rounded-full shadow-inner">{{ pendingOrders().length }}</span>
          </div>
          <div class="p-4 flex-1 overflow-y-auto custom-scroll space-y-4">
            @for (wo of pendingOrders(); track wo.id) {
              <ng-container *ngTemplateOutlet="woCard; context: { $implicit: wo }"></ng-container>
            }
          </div>
        </div>

        <!-- Column: En Proceso (Progress) -->
        <div class="flex-1 min-w-[300px] md:min-w-[350px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col max-h-full snap-center shadow-inner">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl shadow-sm">
            <h3 class="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">
              <i class="fas fa-tools text-amber-500 text-base"></i> En Proceso
            </h3>
            <span class="bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1 rounded-full shadow-inner">{{ inProgressOrders().length }}</span>
          </div>
          <div class="p-4 flex-1 overflow-y-auto custom-scroll space-y-4">
            @for (wo of inProgressOrders(); track wo.id) {
              <ng-container *ngTemplateOutlet="woCard; context: { $implicit: wo }"></ng-container>
            }
          </div>
        </div>

        <!-- Column: Completadas (Completed) -->
        <div class="flex-1 min-w-[300px] md:min-w-[350px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col max-h-full snap-center shadow-inner">
          <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl shadow-sm">
            <h3 class="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">
              <i class="fas fa-check-circle text-emerald-500 text-base"></i> Completadas
            </h3>
            <span class="bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full shadow-inner">{{ completedOrders().length }}</span>
          </div>
          <div class="p-4 flex-1 overflow-y-auto custom-scroll space-y-4">
            @for (wo of completedOrders(); track wo.id) {
              <ng-container *ngTemplateOutlet="woCard; context: { $implicit: wo }"></ng-container>
            }
          </div>
        </div>

      </div>
    </div>

    <!-- Reusable Card Template -->
    <ng-template #woCard let-wo>
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-grab hover:shadow-md hover:border-[#ce1126]/30 transition-all group active:scale-95">
        <div class="flex justify-between items-start mb-3">
          <span class="text-xs font-mono font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">#{{ wo.id }}</span>
          <span class="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm"
            [ngClass]="{
              'bg-red-50 text-red-700 border-red-200': wo.prioridad === 'Alta' || wo.prioridad === 'Urgente',
              'bg-amber-50 text-amber-700 border-amber-200': wo.prioridad === 'Media',
              'bg-emerald-50 text-emerald-700 border-emerald-200': wo.prioridad === 'Baja'
            }">
            {{ wo.prioridad }}
          </span>
        </div>
        
        <h4 class="font-black text-slate-800 text-sm mb-2 line-clamp-2 leading-tight group-hover:text-[#ce1126] transition-colors">{{ wo.titulo }}</h4>
        <p class="text-xs text-slate-500 font-medium mb-4 line-clamp-2 leading-relaxed">{{ wo.descripcion }}</p>
        
        <div class="flex items-center gap-3 mb-4">
          <span class="bg-slate-50 text-slate-600 border border-slate-100 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-2">
            <i class="fas fa-truck-loading text-slate-400"></i> {{ wo.unidad }}
          </span>
          <span class="bg-slate-50 text-slate-600 border border-slate-100 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-2">
            <i class="fas fa-tag text-slate-400"></i> {{ wo.tipo }}
          </span>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-slate-100">
          <div class="flex items-center gap-2">
            @if (wo.tecnico !== 'Sin Asignar') {
              <div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-black border border-indigo-200 shadow-sm" title="Asignado a: {{ wo.tecnico }}">
                {{ wo.tecnico.charAt(0) }}
              </div>
              <span class="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{{ wo.tecnico }}</span>
            } @else {
              <div class="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 text-xs border border-slate-200 border-dashed" title="Sin asignar">
                <i class="fas fa-user-plus"></i>
              </div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin asignar</span>
            }
          </div>
          <div class="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center gap-1.5 uppercase tracking-wider" [ngClass]="{'text-red-600 bg-red-50 border-red-100': isOverdue(wo.fecha)}">
            <i class="far fa-calendar-alt"></i> {{ wo.fecha | date:'dd MMM' }}
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .custom-scroll:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
  `]
})
export class WorkOrdersComponent {
  dataService = inject(DataService);
  searchTerm = signal('');

  workOrders = this.dataService.workOrders;

  filteredOrders = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.workOrders();
    return this.workOrders().filter(wo => 
      wo.titulo.toLowerCase().includes(term) || 
      wo.id.toLowerCase().includes(term) ||
      wo.unidad.toLowerCase().includes(term) ||
      wo.tecnico.toLowerCase().includes(term)
    );
  });

  pendingOrders = computed(() => this.filteredOrders().filter(wo => wo.estatus === 'pending'));
  inProgressOrders = computed(() => this.filteredOrders().filter(wo => wo.estatus === 'progress'));
  completedOrders = computed(() => this.filteredOrders().filter(wo => wo.estatus === 'completed'));

  isOverdue(dateStr: string): boolean {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    return diff > (1000 * 60 * 60 * 24 * 3); // Overdue if older than 3 days
  }
}
