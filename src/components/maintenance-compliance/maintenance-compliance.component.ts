import { Component, AfterViewInit, ViewChild, ElementRef, effect, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { MaintenanceSchedule } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-maintenance-compliance',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="space-y-6 pb-12 animate-fade-in">

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
                       <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">{{ chartStats().onTimePct }}%</span>
                    </div>

                    <!-- Late -->
                    <div class="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-help" title="Ejecutado después de fecha promesa">
                       <div class="flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-red-500 shadow-sm ring-2 ring-red-100 dark:ring-red-900/30"></span>
                          <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Fuera de Objetivo</span>
                       </div>
                       <span class="text-xs font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">{{ chartStats().latePct }}%</span>
                    </div>

                    <!-- In Process -->
                    <div class="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                       <div class="flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                          <span class="text-xs font-bold text-slate-600 dark:text-slate-300">En Proceso</span>
                       </div>
                       <span class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">{{ chartStats().processPct }}%</span>
                    </div>

                     <!-- Overdue -->
                    <div class="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                       <div class="flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></span>
                          <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Vencido</span>
                       </div>
                       <span class="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">{{ chartStats().overduePct }}%</span>
                    </div>
                 </div>
              </div>
          </div>
       </div>

       <!-- Crisis Panel -->
       <div *ngIf="porcentajeVencidos() > 30"
            class="mb-6 bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
         <div class="flex items-start gap-4">
           <div class="flex-shrink-0 w-16 h-16 bg-white bg-opacity-20 rounded-full
                       flex items-center justify-center">
             <span class="text-4xl">⚠️</span>
           </div>
           <div class="flex-1">
             <h2 class="text-2xl font-bold mb-2">
               SITUACIÓN CRÍTICA: {{ porcentajeVencidos() }}% Mantenimientos Vencidos
             </h2>
             <p class="text-red-100 mb-4">
               {{ chartStats().overdue }} de {{ chartStats().overdue + chartStats().onTime + chartStats().late + chartStats().process + chartStats().scheduled }} mantenimientos programados están atrasados.
               Esto incrementa el riesgo de fallas inesperadas en 340%.
             </p>

             <!-- Botón análisis IA -->
             <button (click)="analizarAtrasos()"
                     class="bg-white text-red-600 px-6 py-2 rounded-lg font-bold
                            hover:bg-red-50 transition-colors">
               🤖 Analizar Causas con IA
             </button>

             <!-- Resultado del análisis -->
             <div *ngIf="analisisAtrasos()" class="mt-4 bg-white bg-opacity-10 p-4 rounded-lg">
               <p class="font-bold mb-2">Causas Identificadas:</p>
               <ul class="space-y-1 text-sm">
                 <li *ngFor="let causa of analisisAtrasos().causas">
                   • {{ causa.descripcion }} ({{ causa.porcentaje }}%)
                 </li>
               </ul>

               <p class="font-bold mt-4 mb-2">Acciones Recomendadas:</p>
               <div class="space-y-2">
                 <button *ngFor="let accion of analisisAtrasos().acciones"
                         (click)="ejecutarAccion(accion)"
                         class="w-full bg-white text-left text-red-600 px-4 py-2 rounded
                                text-sm font-semibold hover:bg-red-50">
                   {{ accion.titulo }} →
                 </button>
               </div>
             </div>
           </div>
         </div>
       </div>

       <!-- Capacity Widgets -->
       <div class="grid grid-cols-3 gap-4 mb-6">
         <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow dark:shadow-none border border-transparent dark:border-slate-700">
           <p class="text-sm text-gray-600 dark:text-slate-400 mb-1">Próximos 7 días</p>
           <p class="text-3xl font-bold dark:text-white">{{ capacity7Days() }}</p>
           <p class="text-xs text-gray-500 dark:text-slate-400">mantenimientos</p>
           <div class="mt-2 flex items-center gap-2">
             <div class="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
               <div class="bg-green-500 h-2 rounded-full" style="width: 75%"></div>
             </div>
             <span class="text-xs font-semibold text-green-600">75% capacidad</span>
           </div>
         </div>

         <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow dark:shadow-none border border-transparent dark:border-slate-700">
           <p class="text-sm text-gray-600 dark:text-slate-400 mb-1">Próximos 30 días</p>
           <p class="text-3xl font-bold dark:text-white">{{ capacity30Days() }}</p>
           <p class="text-xs text-gray-500 dark:text-slate-400">mantenimientos</p>
           <div class="mt-2 flex items-center gap-2">
             <div class="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
               <div class="bg-orange-500 h-2 rounded-full" style="width: 112%"></div>
             </div>
             <span class="text-xs font-semibold text-orange-600">⚠️ 112% capacidad</span>
           </div>
         </div>

         <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow dark:shadow-none border border-transparent dark:border-slate-700">
           <p class="text-sm text-gray-600 dark:text-slate-400 mb-1">Técnicos Disponibles</p>
           <p class="text-3xl font-bold dark:text-white">4</p>
           <p class="text-xs text-gray-500 dark:text-slate-400">de 4 activos</p>
           <div class="mt-2">
             <button class="text-xs text-indigo-600 font-semibold">
               + Solicitar apoyo temporal
             </button>
           </div>
         </div>
       </div>

       <!-- Data Table -->
       <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mt-6">

          <!-- Toolbar -->
          <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
             <div class="flex gap-4 items-center">
               <!-- Toggle Vista -->
               <div class="flex gap-2">
                 <button [ngClass]="vista() === 'tabla' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-700 dark:text-slate-200'"
                         (click)="vista.set('tabla')"
                         class="px-4 py-2 rounded-l-lg font-semibold">
                   📋 Tabla
                 </button>
                 <button [ngClass]="vista() === 'calendario' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-700 dark:text-slate-200'"
                         (click)="vista.set('calendario')"
                         class="px-4 py-2 rounded-r-lg font-semibold">
                   📅 Calendario
                 </button>
               </div>

               <h3 class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <i class="fas fa-list text-slate-400"></i>
                  Detalle de Órdenes
               </h3>
               <!-- PDF Button -->
               <button (click)="generateProfessionalReport()"
                       class="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold uppercase rounded shadow hover:bg-slate-700 transition flex items-center gap-2">
                  <i class="fas fa-file-pdf text-red-400"></i> Descargar Reporte
               </button>
             </div>

             <div class="relative w-full md:w-64">
                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="text"
                       [ngModel]="searchText()"
                       (ngModelChange)="searchText.set($event)"
                       placeholder="Buscar OT, Serie o Técnico..."
                       class="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 dark:text-slate-300">
             </div>
          </div>

          <!-- Table View -->
          <div *ngIf="vista() === 'tabla'" class="overflow-x-auto">
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

                         <!-- Dates -->
                         <td class="p-3 align-middle text-center">
                            <div class="flex flex-col gap-1 items-center">
                               <div class="text-slate-500 dark:text-slate-400" title="Fecha Programada">
                                  <i class="far fa-calendar text-[9px] mr-1"></i> {{ row.scheduledDate | date:'dd/MM/yyyy' }}
                               </div>
                               @if (row.realDate) {
                                  <div [class]="getRealDateClass(row)"
                                       [title]="isLateCompletion(row) ? 'Realizado con retraso' : 'Realizado a tiempo'">
                                     <i class="fas fa-check text-[9px] mr-1"></i> {{ row.realDate | date:'dd/MM/yyyy' }}
                                  </div>
                               } @else {
                                  <span class="text-slate-300 text-[9px] italic">- Pendiente -</span>
                               }
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
                                  {{ (row.technician || '?').charAt(0) }}
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
                      </tr>
                   } @empty {
                      <tr>
                         <td colspan="9" class="p-8 text-center text-slate-400 italic">
                            No se encontraron registros de mantenimiento.
                         </td>
                      </tr>
                   }
                </tbody>
             </table>
          </div>

          <!-- Calendar View -->
          <div *ngIf="vista() === 'calendario'" class="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-none p-4">
            <!-- Header calendario -->
            <div class="flex justify-between items-center mb-4">
              <button (click)="previousMonth()" class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded dark:text-slate-200">
                ← Anterior
              </button>
              <h3 class="text-xl font-bold dark:text-white">
                {{ calendarMonthName() }} {{ calendarYear() }}
              </h3>
              <div class="flex gap-2">
                <button (click)="goToToday()" class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm dark:text-slate-200">
                  Hoy
                </button>
                <button (click)="nextMonth()" class="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded dark:text-slate-200">
                  Siguiente →
                </button>
              </div>
            </div>

            <!-- Grid calendario -->
            <div class="grid grid-cols-7 gap-2">
              <!-- Headers días semana -->
              <div *ngFor="let dia of ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']"
                   class="text-center text-sm font-bold text-gray-600 dark:text-slate-400 py-2">
                {{ dia }}
              </div>

              <!-- Días del mes (dinámico) -->
              <div *ngFor="let day of calendarDays()"
                   class="min-h-24 border dark:border-slate-700 rounded-lg p-2 relative dark:text-slate-200"
                   [class.bg-gray-50]="day === 0">
                <span class="text-sm font-semibold">{{ day || '' }}</span>

                <!-- Mantenimientos del día -->
                <div *ngIf="day > 0" class="mt-1 space-y-1">
                  <div *ngFor="let m of getMaintenanceForDay(day)"
                       class="text-xs px-1 py-0.5 rounded bg-green-200 cursor-pointer"
                       [title]="m.smpType + ' - ' + m.economico">
                    <p class="font-semibold truncate">{{ m.smpType }}</p>
                    <p class="truncate">{{ m.economico }}</p>
                  </div>
                </div>

                <!-- Indicador de sobrecarga -->
                <span *ngIf="day > 0 && getMaintenanceForDay(day).length > 2"
                      class="absolute top-1 right-1 bg-red-500 text-white
                             text-xs px-1 rounded-full">
                      +{{ getMaintenanceForDay(day).length - 1 }}
                </span>
              </div>
            </div>

            <!-- Leyenda -->
            <div class="mt-4 flex gap-4 text-xs">
              <div class="flex items-center gap-1">
                <div class="w-4 h-4 bg-green-200 rounded"></div>
                <span>Completado</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-4 h-4 bg-blue-200 rounded"></div>
                <span>Programado</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-4 h-4 bg-orange-200 rounded"></div>
                <span>En proceso</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-4 h-4 bg-red-200 rounded"></div>
                <span>Vencido</span>
              </div>
            </div>
          </div>
       </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MaintenanceComplianceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('complianceChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  chartInstance: any;

  // State
  filterType = signal<string>('ALL');
  searchText = signal('');
  vista = signal<'tabla' | 'calendario'>('tabla');
  analisisAtrasos = signal<any>(null);
  currentCalendarDate = signal<Date>(new Date());

  // Make Math available in template - REMOVED: Use computed signals instead
  // public Math = Math;

  // Calendar computed properties
  calendarYear = computed(() => this.currentCalendarDate().getFullYear());
  calendarMonth = computed(() => this.currentCalendarDate().getMonth());
  calendarMonthName = computed(() => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[this.calendarMonth()];
  });
  calendarDaysInMonth = computed(() => {
    return new Date(this.calendarYear(), this.calendarMonth() + 1, 0).getDate();
  });
  calendarFirstDay = computed(() => {
    return new Date(this.calendarYear(), this.calendarMonth(), 1).getDay();
  });
  calendarDays = computed(() => {
    const days: number[] = [];
    for (let i = 0; i < this.calendarFirstDay(); i++) {
      days.push(0); // Empty cells for days before month starts
    }
    for (let i = 1; i <= this.calendarDaysInMonth(); i++) {
      days.push(i);
    }
    return days;
  });

  constructor(private dataService: DataService) {
    effect(() => {
       const stats = this.chartStats();
       if (this.chartInstance) {
          this.updateChart(stats);
       }
    });
  }

  schedule = this.dataService.maintenanceSchedule;
  stats = this.dataService.complianceStats;

  // Chart Logic computed
  chartStats = computed(() => {
     const list = this.schedule();
     const total = list.length || 1;

     const onTime = list.filter(r => r.status === 'Completado' && !this.isLateCompletion(r)).length;
     const late = list.filter(r => this.isLateCompletion(r)).length;
     const overdue = list.filter(r => r.status === 'Vencido').length;
     const inProcess = list.filter(r => r.status === 'En Proceso').length;
     const scheduled = list.filter(r => r.status === 'Programado').length;

     return {
        onTime, onTimePct: Math.round((onTime/total)*100),
        late, latePct: Math.round((late/total)*100),
        overdue, overduePct: Math.round((overdue/total)*100),
        process: inProcess, processPct: Math.round((inProcess/total)*100),
        scheduled, scheduledPct: Math.round((scheduled/total)*100)
     };
  });

  // Computed capacity forecasts
  capacity7Days = computed(() => Math.round(this.chartStats().scheduled * 0.3) + this.chartStats().process);
  capacity30Days = computed(() => Math.round(this.chartStats().scheduled * 0.8) + this.chartStats().process);

  filteredSchedule = computed(() => {
     const type = this.filterType();
     const text = this.searchText().toLowerCase();

     return this.schedule().filter(item => {
        const matchesType = type === 'ALL' || item.smpType === type;
        const matchesText = !text ||
                            item.economico.toLowerCase().includes(text) ||
                            item.otFolio.toLowerCase().includes(text) ||
                            item.technician.toLowerCase().includes(text) ||
                            item.serial.toLowerCase().includes(text);
        return matchesType && matchesText;
     });
  });

  porcentajeVencidos = computed(() => this.chartStats().overduePct);

  ngAfterViewInit() {
     this.initChart();
  }

  ngOnDestroy() {
     if (this.chartInstance) {
        this.chartInstance.destroy();
     }
  }

  previousMonth() {
    const current = this.currentCalendarDate();
    this.currentCalendarDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth() {
    const current = this.currentCalendarDate();
    this.currentCalendarDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  goToToday() {
    this.currentCalendarDate.set(new Date());
  }

  getMaintenanceForDay(day: number) {
    if (day === 0) return [];
    const schedule = this.schedule();
    const currentYear = this.calendarYear();
    const currentMonth = this.calendarMonth();
    
    return schedule.filter(item => {
      const itemDate = new Date(item.scheduledDate);
      return itemDate.getFullYear() === currentYear && 
             itemDate.getMonth() === currentMonth && 
             itemDate.getDate() === day;
    });
  }

  initChart() {
     if (!this.chartCanvas || typeof Chart === 'undefined') return;

     const ctx = this.chartCanvas.nativeElement.getContext('2d');
     if (!ctx) return;
     
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
                 '#f97316', // Orange 500 (Overdue)
                 '#3b82f6', // Blue 500
                 '#e2e8f0'  // Slate 200 (Scheduled)
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

  generateProfessionalReport() {
    const doc = new jsPDF({ orientation: 'landscape' });
    const reportData = this.filteredSchedule();

    const head = [
        [
            { content: 'Modelo', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Serie', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Economico', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Supervisor', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'SMP', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Fecha', colSpan: 2, styles: { halign: 'center' as const } },
            { content: 'Duracion del SMP', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Folio OT', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Orden de Serv.', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Horometro', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Tecnico Real', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
            { content: 'Hora de ejecucion de SMP', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
        ],
        ['Programada', 'Real']
    ];

    const body = reportData.map(item => [
        item.model,
        item.serial,
        item.economico,
        item.supervisor,
        item.smpType,
        item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('es-MX', { day:'2-digit', month: '2-digit', year: 'numeric' }) : '',
        item.realDate ? new Date(item.realDate).toLocaleDateString('es-MX', { day:'2-digit', month: '2-digit', year: 'numeric' }) : '',
        item.duration,
        item.otFolio,
        item.serviceOrder,
        item.hourMeter || '',
        item.technician,
        ''
    ]);

    // HEADER
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#ce1126');
    doc.text('ORSTED CORP', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('EQUIPOS INDUSTRIALES', 14, 26);

    // DATE BOX
    doc.setFontSize(8);
    doc.setDrawColor(0);
    doc.rect(140, 15, 20, 7);
    doc.text('feb-26', 142, 20);

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
        head: head,
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
        },
        didDrawPage: (data) => {
            doc.setDrawColor(204, 0, 0);
            doc.setLineWidth(1.5);
            const table = data.table as any;
            const { x, y, width, height } = table;
            doc.rect(x, y, width, height);
        }
    });

    // FOOTER
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('Nota: la programacion puede estar sujeta a cambios dependiendo del horometro, asi como la hora programada', 14, finalY + 5);

    doc.save(`Programa_SMP_Orsted.pdf`);
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
        case 'Vencido': return 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse';
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
        return 'bg-brand-red text-white border-brand-red shadow-md';
     }
     return 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700';
  }

  analizarAtrasos() {
    // Mock analysis
    this.analisisAtrasos.set({
      causas: [
        { descripcion: 'Falta de técnicos especializados', porcentaje: 35 },
        { descripcion: 'Refacciones no disponibles', porcentaje: 28 },
        { descripcion: 'Programación ineficiente', porcentaje: 22 },
        { descripcion: 'Fallas imprevistas', porcentaje: 15 }
      ],
      acciones: [
        { titulo: 'Contratar técnico adicional', id: 'contratar_tecnico' },
        { titulo: 'Aumentar stock crítico', id: 'aumentar_stock' },
        { titulo: 'Optimizar calendario SMP', id: 'optimizar_calendario' }
      ]
    });
  }

  ejecutarAccion(accion: any) {
    alert(`[DEMO] Ejecutando acción: ${accion.titulo}`);
  }
}
