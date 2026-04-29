import { Component, inject, computed, signal, AfterViewInit, ViewChild, ElementRef, effect, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, PercentPipe, UpperCasePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { MaintenanceSchedule } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare const Chart: any;

@Component({
  selector: 'app-maintenance-compliance',
  standalone: true,
  imports: [CommonModule, DatePipe, PercentPipe, UpperCasePipe, DecimalPipe, FormsModule],
  template: `
    <div class="space-y-6 pb-12 animate-fade-in relative">

       <!-- Header & KPIs -->
       <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">

          <!-- Context & Controls -->
          <div class="lg:col-span-1 flex flex-col justify-between space-y-4">
             <div>
                <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Programa SMP</h2>
                <p class="text-xs text-slate-500 mt-2 font-medium">Cumplimiento de Mantenimiento Planificado</p>
             </div>

             <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Filtrar por Nivel</label>
                <div class="flex flex-wrap gap-2">
                   @for(type of ['ALL', 'REV', 'X', 'Y', 'Z']; track type) {
                      <button (click)="filterType.set(type)"
                              [class]="getFilterClass(type)"
                              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border">
                         {{ type === 'ALL' ? 'Todos' : type }}
                      </button>
                   }
                </div>
             </div>

             <!-- Mini Stats Summary -->
             <div class="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div class="flex justify-between items-center mb-2">
                   <span class="text-xs font-bold text-slate-500">Total Programado</span>
                   <span class="text-sm font-black text-slate-800 dark:text-white">{{ stats().total }}</span>
                </div>
                <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                   <div class="bg-blue-500 h-full" [style.width.%]="(stats().completed / stats().total) * 100"></div>
                </div>
             </div>
          </div>

          <!-- Chart & Analysis Section -->
          <div class="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
              <h3 class="font-bold text-slate-700 dark:text-slate-200 text-sm mb-4 flex items-center gap-2">
                 <i class="fas fa-chart-pie text-slate-400"></i> Análisis de Ejecución
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                 <!-- Canvas Container -->
                 <div class="relative h-48 w-full flex justify-center">
                    <canvas #complianceChart></canvas>
                    <!-- Center Text Overlay -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span class="text-3xl font-black text-slate-800 dark:text-white">{{ stats().percentage }}%</span>
                       <span class="text-[10px] font-bold text-slate-400 uppercase">Avance</span>
                    </div>
                 </div>

                 <!-- Legend / Detailed Breakdown -->
                 <div class="space-y-3">
                    <!-- On Time -->
                    <div class="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-help" title="Ejecutado en o antes de fecha programada">
                       <div class="flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span>
                          <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Completado a Tiempo</span>
                       </div>
                       <span class="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{{ chartStats().onTimePct }}%</span>
                    </div>

                    <!-- Late -->
                    <div class="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-help" title="Ejecutado después de fecha promesa">
                       <div class="flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-red-500 shadow-sm ring-2 ring-red-100 dark:ring-red-900/30"></span>
                          <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Fuera de Objetivo</span>
                       </div>
                       <span class="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{{ chartStats().latePct }}%</span>
                    </div>
                    
                    <!-- Overdue (New) -->
                    <div class="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-help" title="Fecha vencida y sin ejecución">
                       <div class="flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-amber-500 shadow-sm animate-pulse"></span>
                          <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Vencido</span>
                       </div>
                       <span class="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{{ chartStats().overduePct }}%</span>
                    </div>

                    <!-- In Process -->
                    <div class="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                       <div class="flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                          <span class="text-xs font-bold text-slate-600 dark:text-slate-300">En Proceso</span>
                       </div>
                       <span class="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{{ chartStats().processPct }}%</span>
                    </div>
                 </div>
              </div>
          </div>
       </div>

       <!-- Data Table -->
       <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mt-6">
          
          <!-- Toolbar -->
          <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
             <div class="flex gap-4 items-center flex-wrap">
               <h3 class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <i class="fas fa-list text-slate-400"></i>
                  Detalle de Órdenes
               </h3>
               
               <!-- DOWNLOAD TEMPLATE BUTTON -->
               <button (click)="downloadTemplate()"
                       class="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-[10px] font-bold uppercase rounded shadow-sm hover:bg-slate-50 transition flex items-center gap-2 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600">
                  <i class="fas fa-download text-blue-500"></i> Descargar Plantilla
               </button>

               <!-- IMPORT BUTTON -->
               <input type="file" #fileInput (change)="importSchedule($event)" accept=".xlsx, .xls" hidden />
               <button (click)="fileInput.click()"
                       class="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-[10px] font-bold uppercase rounded shadow-sm hover:bg-slate-50 transition flex items-center gap-2 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600">
                  <i class="fas fa-file-excel text-green-600"></i> Importar Programa
               </button>

               <!-- EXPORT BUTTON -->
               <button (click)="generateProfessionalReport()" 
                       [disabled]="isGeneratingPdf()"
                       class="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold uppercase rounded shadow hover:bg-slate-700 transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  @if (isGeneratingPdf()) {
                    <i class="fas fa-spinner fa-spin"></i> Generando...
                  } @else {
                    <i class="fas fa-file-pdf text-red-400"></i> Descargar Reporte
                  }
               </button>
             </div>
             
             <div class="relative w-full md:w-64">
                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="text" 
                       [(ngModel)]="searchText"
                       placeholder="Buscar OT, Serie o Técnico..." 
                       class="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 dark:text-slate-300">
             </div>
          </div>

          <!-- Table Container -->
          <div class="overflow-x-auto min-h-[500px]">
             <table class="w-full text-left border-collapse">
                <thead class="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                   <tr>
                      <th class="p-3 whitespace-nowrap">Nivel SMP</th>
                      <th class="p-3">Unidad / Serie</th>
                      <th class="p-3">Supervisor</th>
                      <th class="p-3 text-center">Programado vs Real</th>
                      <th class="p-3 text-center">Duración</th>
                      <th class="p-3">Folio OT / OS</th>
                      <th class="p-3 text-right">Horómetro</th>
                      <th class="p-3">Técnico</th>
                      <th class="p-3 text-center">Estatus</th>
                      <th class="p-3 text-center w-8"></th> <!-- Comments Column -->
                      <th class="p-3 text-center">Acciones</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                   @for (row of filteredSchedule(); track row.id) {
                      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                         
                         <!-- SMP Level Badge -->
                         <td class="p-3 align-middle">
                            <span [class]="'inline-block px-2 py-1 rounded w-12 text-center font-black ' + getSmpBadgeClass(row.smpType)">
                               {{ row.smpType }}
                            </span>
                         </td>

                         <!-- Unit Info -->
                         <td class="p-3 align-middle">
                            <div class="font-bold text-slate-700 dark:text-slate-200">{{ row.economico }}</div>
                            <div class="text-[10px] text-slate-400 font-mono">{{ row.model }} - {{ row.serial }}</div>
                         </td>

                         <!-- Supervisor -->
                         <td class="p-3 align-middle text-slate-600 dark:text-slate-400 font-medium">
                            {{ row.supervisor }}
                         </td>

                         <!-- Dates (Programado vs Real EDITABLE) -->
                         <td class="p-3 align-middle text-center">
                            <div class="flex flex-col gap-1 items-center">
                               <div class="text-slate-500 dark:text-slate-400" title="Fecha Programada" [class.text-red-500]="row.status === 'Vencido'">
                                  <i class="far fa-calendar text-[9px] mr-1"></i> {{ row.scheduledDate | date:'dd/MM/yyyy' }}
                               </div>
                               
                               <!-- Editable Date Input -->
                               <div class="relative group/date">
                                  <input type="date"
                                         [ngModel]="row.realDate ? (row.realDate | date:'yyyy-MM-dd') : ''"
                                         (ngModelChange)="onDateChange(row.id, $event)"
                                         class="text-[10px] font-bold p-1 rounded border cursor-pointer outline-none focus:ring-1 focus:ring-blue-500 text-center w-28"
                                         [class.bg-emerald-50]="row.realDate && !isLateCompletion(row)"
                                         [class.text-emerald-700]="row.realDate && !isLateCompletion(row)"
                                         [class.border-emerald-200]="row.realDate && !isLateCompletion(row)"
                                         [class.bg-red-50]="isLateCompletion(row)"
                                         [class.text-red-700]="isLateCompletion(row)"
                                         [class.border-red-200]="isLateCompletion(row)"
                                         [class.bg-slate-50]="!row.realDate"
                                         [class.text-slate-400]="!row.realDate"
                                         [class.border-slate-200]="!row.realDate"
                                  >
                               </div>
                            </div>
                         </td>

                         <!-- Duration -->
                         <td class="p-3 align-middle text-center font-mono text-slate-600 dark:text-slate-400">
                            {{ row.duration }}
                         </td>

                         <!-- Folios -->
                         <td class="p-3 align-middle">
                            <div class="flex flex-col">
                               <span class="font-bold text-slate-700 dark:text-slate-300">{{ row.otFolio }}</span>
                               <span class="text-[10px] text-slate-400">{{ row.serviceOrder }}</span>
                            </div>
                         </td>

                         <!-- Hour Meter -->
                         <td class="p-3 align-middle text-right font-mono text-slate-600 dark:text-slate-400">
                            {{ row.hourMeter ? (row.hourMeter | number) : '-' }} h
                         </td>

                         <!-- Technician -->
                         <td class="p-3 align-middle">
                            <div class="flex items-center gap-2">
                               <div class="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-bold">
                                  {{ row.technician.charAt(0) }}
                               </div>
                               <span class="text-slate-600 dark:text-slate-300">{{ row.technician }}</span>
                            </div>
                         </td>

                         <!-- Status -->
                         <td class="p-3 align-middle text-center">
                            <span [class]="'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ' + getStatusClass(row)">
                               {{ getStatusLabel(row) }}
                            </span>
                         </td>
                         
                         <!-- Comments Tooltip on Hover -->
                         <td class="p-3 align-middle text-center relative">
                             @if(row.comments) {
                                <div class="relative group/tooltip inline-block cursor-help">
                                    <i class="fas fa-comment-alt text-slate-300 group-hover/tooltip:text-blue-500 transition-colors"></i>
                                    <!-- Tooltip content -->
                                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none text-left leading-tight">
                                        {{ row.comments }}
                                        <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                </div>
                             }
                         </td>

                         <!-- Actions -->
                         <td class="p-3 align-middle text-center">
                            <button (click)="openModal(row)" 
                                    class="text-slate-400 hover:text-[#ce1126] transition-colors p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" 
                                    title="Ver Detalles e Historial">
                               <i class="fas fa-info-circle text-lg"></i>
                            </button>
                         </td>
                      </tr>
                   } @empty {
                      <tr>
                         <td colspan="11" class="p-8 text-center text-slate-400 italic">
                            No se encontraron registros de mantenimiento.
                         </td>
                      </tr>
                   }
                </tbody>
             </table>
          </div>
       </div>
    </div>

    <!-- DETAIL MODAL -->
    @if (selectedSchedule()) {
       <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" (click)="closeModal()">
          <div class="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()">
             
             <!-- Header -->
             <div class="bg-[#ce1126] text-white p-6 relative shrink-0">
                <button (click)="closeModal()" class="absolute top-4 right-4 text-white/70 hover:text-white transition">
                   <i class="fas fa-times text-xl"></i>
                </button>
                <div class="flex items-start justify-between">
                   <div>
                      <p class="text-[10px] font-bold uppercase opacity-80 tracking-widest mb-1">Detalle de Mantenimiento</p>
                      <h2 class="text-3xl font-black">{{ selectedSchedule()!.economico }}</h2>
                      <p class="text-sm font-medium mt-1">{{ selectedSchedule()!.model }} | Serie: {{ selectedSchedule()!.serial }}</p>
                   </div>
                   <div class="text-right">
                      <span class="inline-block px-3 py-1 bg-white/20 rounded-lg text-xs font-bold uppercase backdrop-blur-md border border-white/30">
                         Nivel SMP: {{ selectedSchedule()!.smpType }}
                      </span>
                   </div>
                </div>
             </div>

             <div class="p-6 overflow-y-auto custom-scroll flex-1">
                
                <!-- Info Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                   <div class="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                      <label class="block text-[10px] font-bold text-slate-400 uppercase">Supervisor</label>
                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200 truncate block">{{ selectedSchedule()!.supervisor }}</span>
                   </div>
                   <div class="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                      <label class="block text-[10px] font-bold text-slate-400 uppercase">Técnico</label>
                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200 truncate block">{{ selectedSchedule()!.technician }}</span>
                   </div>
                   <div class="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                      <label class="block text-[10px] font-bold text-slate-400 uppercase">Duración</label>
                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ selectedSchedule()!.duration }}</span>
                   </div>
                   <div class="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                      <label class="block text-[10px] font-bold text-slate-400 uppercase">Horómetro</label>
                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ selectedSchedule()!.hourMeter || '-' }} hrs</span>
                   </div>
                </div>

                <!-- Status & Dates -->
                <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl mb-6 border border-slate-100 dark:border-slate-700">
                   <div>
                      <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Estatus Actual</label>
                      <span [class]="'px-3 py-1 rounded-full text-xs font-bold uppercase ' + getStatusClass(selectedSchedule()!)">
                         {{ getStatusLabel(selectedSchedule()!) }}
                      </span>
                   </div>
                   <div class="text-right flex gap-6">
                      <div>
                         <label class="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Programado</label>
                         <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ selectedSchedule()!.scheduledDate | date:'dd MMM yyyy' }}</span>
                      </div>
                      <div>
                         <label class="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Ejecutado</label>
                         <span class="text-sm font-bold" [class.text-emerald-600]="selectedSchedule()!.realDate" [class.text-slate-400]="!selectedSchedule()!.realDate">
                            {{ selectedSchedule()!.realDate ? (selectedSchedule()!.realDate | date:'dd MMM yyyy') : 'Pendiente' }}
                         </span>
                      </div>
                   </div>
                </div>

                <!-- Comments Section -->
                <div class="mb-8">
                   <label class="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2">
                     <i class="fas fa-sticky-note"></i> Comentarios / Observaciones
                   </label>
                   <textarea 
                       [value]="selectedSchedule()!.comments || ''" 
                       (change)="updateComments(selectedSchedule()!.id, $any($event.target).value)"
                       class="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#ce1126] outline-none transition-shadow placeholder:text-slate-400"
                       rows="3"
                       placeholder="Escribe aquí cualquier comentario adicional (visible al pasar el mouse en la tabla)..."></textarea>
                   <p class="text-[10px] text-slate-400 mt-1 italic text-right">Los cambios se guardan automáticamente al salir del campo.</p>
                </div>

                <!-- History Timeline -->
                <h3 class="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                   <i class="fas fa-history text-slate-400"></i> Historial de Cambios
                </h3>
                
                <div class="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                   @for (log of (selectedSchedule()?.history || []).slice().reverse(); track $index) {
                      <div class="relative">
                         <div class="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-slate-300 dark:border-slate-500"></div>
                         <div class="flex justify-between items-start">
                            <div>
                               <p class="text-xs font-bold text-slate-700 dark:text-slate-200">{{ log.action }}</p>
                               <p class="text-[10px] text-slate-400 mt-0.5">Por: {{ log.user }}</p>
                            </div>
                            <span class="text-[10px] font-mono text-slate-400">{{ log.timestamp | date:'short' }}</span>
                         </div>
                         <div class="mt-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <span class="line-through opacity-60">{{ log.previousValue }}</span>
                            <i class="fas fa-arrow-right text-[10px] text-slate-400"></i>
                            <span class="font-bold text-blue-600 dark:text-blue-400">{{ log.newValue }}</span>
                         </div>
                      </div>
                   } @empty {
                      <div class="text-xs text-slate-400 italic py-2">No hay cambios registrados en el historial.</div>
                   }
                </div>

             </div>
             
             <!-- Footer -->
             <div class="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
                <button (click)="closeModal()" class="px-5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition">
                   Cerrar
                </button>
             </div>
          </div>
       </div>
    }
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MaintenanceComplianceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('complianceChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  dataService = inject(DataService);
  chartInstance: any;

  // State
  filterType = signal<string>('ALL');
  searchText = signal<string>('');
  sortKey = signal<keyof MaintenanceSchedule>('scheduledDate');
  sortDirection = signal<'asc' | 'desc'>('asc');
  isGeneratingPdf = signal(false);
  selectedSchedule = signal<MaintenanceSchedule | null>(null);
  
  schedule = this.dataService.maintenanceSchedule;
  stats = this.dataService.complianceStats;

  // Chart Logic computed
  chartStats = computed(() => {
     const list = this.schedule();
     const total = list.length || 1;
     
     const onTime = list.filter(r => (r.status as string) === 'Completado' && !this.isLateCompletion(r)).length;
     const late = list.filter(r => this.isLateCompletion(r)).length;
     const overdue = list.filter(r => (r.status as string) === 'Vencido').length;
     const inProcess = list.filter(r => (r.status as string) === 'En Proceso').length;
     const scheduled = list.filter(r => (r.status as string) === 'Programado').length;

     return {
        onTime, onTimePct: Math.round((onTime/total)*100),
        late, latePct: Math.round((late/total)*100),
        overdue, overduePct: Math.round((overdue/total)*100),
        process: inProcess, processPct: Math.round((inProcess/total)*100),
        scheduled, scheduledPct: Math.round((scheduled/total)*100)
     };
  });

  filteredSchedule = computed(() => {
     const type = this.filterType();
     const text = this.searchText().toLowerCase();
     const key = this.sortKey();
     const dir = this.sortDirection();
     
     const filtered = this.schedule().filter(item => {
        const matchesType = type === 'ALL' || item.smpType === type;
        const matchesText = !text || 
                            item.economico.toLowerCase().includes(text) || 
                            item.otFolio.toLowerCase().includes(text) ||
                            item.technician.toLowerCase().includes(text) ||
                            item.serial.toLowerCase().includes(text);
        return matchesType && matchesText;
     });

     // Sorting
     return filtered.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        let comparison: number;
        if (typeof valA === 'string' && typeof valB === 'string') {
           comparison = valA.localeCompare(valB);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
           comparison = valA - valB;
        } else {
           comparison = String(valA).localeCompare(String(valB));
        }

        return dir === 'asc' ? comparison : -comparison;
     });
  });

  constructor() {
    effect(() => {
       const stats = this.chartStats();
       if (this.chartInstance) {
          this.updateChart(stats);
       }
    });
  }

  toggleSort(key: keyof MaintenanceSchedule) {
     if (this.sortKey() === key) {
        this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
     } else {
        this.sortKey.set(key);
        this.sortDirection.set('asc');
     }
  }

  getSortIcon(key: string): string {
     if (this.sortKey() !== key) return 'fa-sort text-slate-300';
     return this.sortDirection() === 'asc' ? 'fa-sort-up text-blue-500' : 'fa-sort-down text-blue-500';
  }

  ngAfterViewInit() {
     this.initChart();
  }

  ngOnDestroy() {
     if (this.chartInstance) {
        this.chartInstance.destroy();
     }
  }

  initChart() {
     if (!this.chartCanvas || typeof Chart === 'undefined') return;

     const ctx = this.chartCanvas.nativeElement.getContext('2d');
     const s = this.chartStats();

     this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
           labels: ['A Tiempo', 'Fuera de Obj.', 'Vencido', 'En Proceso', 'Por Iniciar'],
           datasets: [{
              data: [s.onTime, s.late, s.overdue, s.process, s.scheduled],
              backgroundColor: [
                 '#10b981', // Emerald 500
                 '#ef4444', // Red 500
                 '#f59e0b', // Amber 500 (Vencido)
                 '#3b82f6', // Blue 500
                 '#e2e8f0'  // Slate 200
              ],
              borderWidth: 0,
              hoverOffset: 4
           }]
        },
        options: {
           responsive: true,
           maintainAspectRatio: false,
           cutout: '75%',
           plugins: {
              legend: { display: false },
              tooltip: {
                 callbacks: {
                    label: function(context: any) {
                        const val = context.raw;
                        const total = context.chart._metasets[context.datasetIndex].total;
                        const pct = Math.round((val / total) * 100) + '%';
                        return ` ${context.label}: ${val} (${pct})`;
                    }
                 }
              }
           }
        }
     });
  }

  updateChart(stats: any) {
      this.chartInstance.data.datasets[0].data = [
         stats.onTime, 
         stats.late, 
         stats.overdue, 
         stats.process, 
         stats.scheduled
      ];
      this.chartInstance.update();
  }

  async onDateChange(id: string, newDate: string) {
     await this.dataService.updateMaintenanceDate(id, newDate);
     
     // Update selected schedule reference if modal is open to reflect changes immediately
     const updated = this.schedule().find(s => s.id === id);
     if (updated && this.selectedSchedule()?.id === id) {
        this.selectedSchedule.set(updated);
     }
  }

  async updateComments(id: string, comments: string) {
     await this.dataService.updateMaintenanceComments(id, comments);
     // Update selected schedule reference
     const updated = this.schedule().find(s => s.id === id);
     if (updated && this.selectedSchedule()?.id === id) {
        this.selectedSchedule.set(updated);
     }
  }

  // --- Modal Logic ---
  openModal(row: MaintenanceSchedule) {
     this.selectedSchedule.set(row);
  }

  closeModal() {
     this.selectedSchedule.set(null);
  }

  downloadTemplate() {
    // Definir encabezados exactos que el sistema reconoce
    const headers = [
      ['Modelo', 'Serie', 'Economico', 'Supervisor', 'SMP', 'Fecha Programada', 'Fecha Real', 'Duración SMP', 'Folio OT', 'Orden de Serv.', 'Horómetro', 'Técnico Real']
    ];

    // Ejemplo de datos
    const data = [
      ['8FGU30', '60504', 'CUA-25436', 'Aaron Velazquez', 'REV', '16/02/2026', '', '2hrs', 'MXOT184269', 'OS-12345', '35250.9', 'Erick Ramon']
    ];

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...data]);
    
    // Ajustar ancho de columnas para mejor legibilidad
    ws['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, 
      { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Carga');
    XLSX.writeFile(wb, 'Plantilla_Programa_Mantenimiento.xlsx');
  }

  async importSchedule(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
       try {
          const bstr = e.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];

          // --- HEADER DETECTION LOGIC ---
          // Read first as array of arrays to find the header row (ignoring logos/titles)
          const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          let headerRowIndex = 0;
          
          // Scan first 10 rows for keywords "Modelo" or "Economico"
          for (let i = 0; i < Math.min(aoa.length, 10); i++) {
              const rowStr = (aoa[i] || []).join(' ').toLowerCase();
              if (rowStr.includes('modelo') || rowStr.includes('economico') || rowStr.includes('serie')) {
                  headerRowIndex = i;
                  break;
              }
          }

          // Read again using the detected header row as start
          const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex });
          
          if (data.length > 0) {
             const result = await this.dataService.updateMaintenanceScheduleFromExcel(data);
             
             let msg = `Proceso finalizado.\n\nRegistros importados exitosamente: ${result.success}`;
             
             if (result.errors.length > 0) {
                 msg += `\n\n⚠️ Errores encontrados (${result.errors.length}):\n`;
                 // Show first 10 errors max
                 msg += result.errors.slice(0, 10).join('\n');
                 if (result.errors.length > 10) {
                     msg += `\n... y ${result.errors.length - 10} errores más.`;
                 }
                 msg += '\n\nPor favor revise el archivo y vuelva a intentar con las filas corregidas.';
             }
             
             console.warn('ALERT:', msg);
             
          } else {
             console.warn('ALERT:', 'El archivo Excel parece estar vacío o no tiene datos legibles.');
          }
       } catch (err) {
          console.error(err);
          console.warn('ALERT:', 'Error crítico al procesar el archivo. Asegúrate de que sea un Excel válido (.xlsx).');
       }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
  }

  generateProfessionalReport() {
    this.isGeneratingPdf.set(true);
    
    // Wrap in setTimeout to allow UI to update (show loading spinner) before main thread freezes for PDF generation
    setTimeout(() => {
        try {
          const reportData = this.filteredSchedule();
          if (reportData.length === 0) {
            console.warn('ALERT:', "No hay datos para generar el reporte. Por favor verifique los filtros o importe un programa.");
            this.isGeneratingPdf.set(false);
            return;
          }

          const doc = new jsPDF({ orientation: 'landscape' });

          // FIX: Explicitly typed 'head' as 'any' to avoid type mismatches with jspdf-autotable's complex union types
          const head: any[][] = [
              [
                  { content: 'Modelo', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                  { content: 'Serie', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                  { content: 'Economico', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                  { content: 'Supervisor', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                  { content: 'SMP', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                  { content: 'Fecha', colSpan: 2, styles: { halign: 'center' } },
                  { content: 'Duracion del SMP', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                  { content: 'Folio OT', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                  { content: 'Orden de Serv.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                  { content: 'Horometro', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                  { content: 'Tecnico Real', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                  { content: 'Hora de ejecucion de SMP', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
              ],
              ['Programada', 'Real']
          ];

          const body = reportData.map(item => [
              item.model || '-',
              item.serial || '-',
              item.economico || '-',
              item.supervisor || '-',
              item.smpType || '-',
              item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('es-MX', { day:'2-digit', month: '2-digit', year: 'numeric' }) : '-',
              item.realDate ? new Date(item.realDate).toLocaleDateString('es-MX', { day:'2-digit', month: '2-digit', year: 'numeric' }) : '-',
              item.duration || '-',
              item.otFolio || '-',
              item.serviceOrder || '-',
              item.hourMeter || '-',
              item.technician || '-',
              ''
          ]);
          
          // HEADER
          doc.setFontSize(22);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor('#d92a2f');
          doc.text('TOYOTA', 14, 20);
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text('EQUIPOS INDUSTRIALES', 14, 26);
          
          // DATE BOX
          const now = new Date();
          doc.setFontSize(8);
          doc.setDrawColor(0);
          doc.rect(140, 15, 20, 7);
          doc.text(now.toLocaleDateString('es-MX', {month:'short', year:'2-digit'}), 142, 20);

          // SMP KEY TABLE
          autoTable(doc, {
              head: [['', 'SER-FO-016 Rev. 00']],
              body: [
                  [{content: 'X', styles: {fillColor: '#9dc3e6'}} , '500 hrs'],
                  [{content: 'Y', styles: {fillColor: '#ffff00'}}, '1000 hrs'],
                  [{content: 'Z', styles: {fillColor: '#ffc000'}}, '2000 hrs'],
                  ['REV', 'REVISION (sin insumos)'],
              ],
              startY: 10,
              theme: 'grid',
              tableWidth: 60,
              margin: { left: 220 },
              styles: { fontSize: 8, cellPadding: 1, lineColor: 0, lineWidth: 0.1 },
              headStyles: { fillColor: '#ffffff', textColor: 0, fontStyle: 'normal' },
              columnStyles: { 0: {halign: 'center', fontStyle: 'bold'}}
          });

          // MAIN TABLE
          autoTable(doc, {
              head: head, // Passed as any
              body: body,
              startY: 35,
              theme: 'grid',
              styles: {
                  lineWidth: 0.1,
                  lineColor: [0, 0, 0],
                  fontSize: 7,
                  halign: 'center',
                  valign: 'middle',
                  cellPadding: 1.5,
              },
              headStyles: {
                  fillColor: [217, 217, 217],
                  textColor: [0, 0, 0],
                  fontStyle: 'bold',
                  fontSize: 7,
              },
              didParseCell: (data) => {
                  if (data.section === 'body' && data.column.index === 4) {
                      const smpType = data.cell.raw;
                      if (smpType === 'X') data.cell.styles.fillColor = '#9dc3e6';
                      if (smpType === 'Y') data.cell.styles.fillColor = '#ffff00';
                      if (smpType === 'Z') data.cell.styles.fillColor = '#ffc000';
                  }
                  if (data.section === 'body' && (data.column.index === 8 || data.column.index === 9)) {
                      data.cell.styles.fillColor = '#f8cbad';
                  }
              }
          });
          
          // FOOTER
          // Safe access to lastAutoTable
          const finalY = (doc as any).lastAutoTable?.finalY || 150;
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          doc.text('Nota: la programacion puede estar sujeta a cambios dependiendo del horometro, asi como la hora programada', 14, finalY + 5);

          doc.save(`Programa_SMP_Toyota_${now.toISOString().split('T')[0]}.pdf`);

        } catch (e) {
          console.error("Error generando PDF:", e);
          console.warn('ALERT:', "Hubo un error al generar el reporte. Por favor revisa la consola para más detalles.");
        } finally {
          this.isGeneratingPdf.set(false);
        }
    }, 100);
  }


  // --- Helper Methods ---

  getSmpBadgeClass(type: string): string {
     switch(type) {
        case 'REV': return 'bg-sky-100 text-sky-800 border border-sky-200';
        case 'X': return 'bg-[#f5e6d3] text-[#8c6b4a] border border-[#e6d0b3]';
        case 'Y': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'Z': return 'bg-red-100 text-red-800 border border-red-200';
        default: return 'bg-slate-100 text-slate-800';
     }
  }

  isLateCompletion(row: MaintenanceSchedule): boolean {
     if (row.status !== 'Completado' || !row.realDate) return false;
     
     const scheduled = new Date(row.scheduledDate);
     const real = new Date(row.realDate);
     scheduled.setHours(0,0,0,0);
     real.setHours(0,0,0,0);
     
     return real.getTime() > scheduled.getTime();
  }

  getStatusLabel(row: MaintenanceSchedule): string {
     if (this.isLateCompletion(row)) return 'Completado Fuera de Obj.';
     if (row.status === 'Completado') return 'Completado a Tiempo';
     return row.status;
  }

  getStatusClass(row: MaintenanceSchedule): string {
     if (this.isLateCompletion(row)) {
        return 'bg-red-50 text-red-700 border-red-200 font-black';
     }

     switch(row.status) {
        case 'Completado': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        case 'Programado': return 'bg-blue-50 text-blue-600 border-blue-200';
        case 'Vencido': return 'bg-orange-50 text-orange-700 border-orange-200 font-bold animate-pulse';
        case 'En Proceso': return 'bg-blue-50 text-blue-600 border-blue-200';
        default: return 'bg-slate-50 text-slate-600';
     }
  }

  getRealDateClass(row: MaintenanceSchedule): string {
     if (this.isLateCompletion(row)) return 'text-red-600 font-bold bg-red-50 px-1.5 rounded dark:bg-red-900/20 dark:text-red-400';
     return 'text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded dark:bg-emerald-900/20 dark:text-emerald-400';
  }

  getFilterClass(type: string): string {
     if (this.filterType() === type) {
        return 'bg-[#ce1126] text-white border-[#ce1126] shadow-md';
     }
     return 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50';
  }
}