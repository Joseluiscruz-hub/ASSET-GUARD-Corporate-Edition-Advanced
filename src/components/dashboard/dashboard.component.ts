import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { KpiCardComponent } from '../ui/kpi-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, DatePipe, CurrencyPipe],
  template: `
    <div class="space-y-8 pb-20 animate-fade-in">
      <!-- Header Section -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-femsa-red rounded-full animate-pulse"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Centro de Operaciones Digitales</span>
          </div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display">Executive NOC Dashboard</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-3">
            <span class="font-bold text-slate-700 dark:text-slate-300">Status: Operación Estable</span>
            <span class="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
            <span class="text-xs">Sincronización en tiempo real: {{ lastUpdate() | date: 'HH:mm:ss' }}</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="downloadReport()" class="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm active:scale-95">
            <i class="fas fa-file-pdf text-femsa-red"></i> Exportar Reporte
          </button>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <app-kpi-card title="Seguridad Industrial" subtitle="Días sin incidentes" [value]="safetyStats().daysWithoutAccident" unit="días" status="success" statusText="Cumplimiento OK" footerLabel="Récord de Planta" [footerValue]="safetyStats().record + ' días'" [trendLabel]="'Faltan ' + (safetyStats().record - safetyStats().daysWithoutAccident) + ' p/ récord'"></app-kpi-card>
        
        <article class="h-full rounded-[24px] p-6 flex flex-col gap-4 transition-all duration-300 hover-lift relative overflow-hidden group border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>
          
          <header class="flex items-start justify-between relative z-10">
            <div>
              <h2 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">Disponibilidad</h2>
              <p class="text-xs font-bold text-slate-600 dark:text-slate-300">Eficiencia de Flota</p>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full text-[9px] font-black px-3 py-1.5 border uppercase tracking-widest backdrop-blur-md bg-red-500/10 text-red-600 border-red-500/20">
              <span class="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              {{ availabilityStatusText() }}
            </span>
          </header>
          
          <div class="flex items-baseline gap-2 mt-2 relative z-10">
            <span class="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display">{{ fleetAvailability().percentage }}</span>
            <span class="text-xs font-black text-slate-400 uppercase tracking-widest">%</span>
          </div>

          <footer class="mt-auto flex items-center justify-between text-[10px] pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
            <div class="flex flex-col">
              <span class="text-slate-400 font-bold uppercase tracking-wider">Meta 95%</span>
              <span class="text-slate-900 dark:text-white font-black mt-0.5">83.0% Actual</span>
            </div>
            <div class="px-2 py-1 rounded-md font-black uppercase tracking-tighter bg-red-500/5">
              <span class="text-red-600">{{ availabilityGap() }}</span>
            </div>
          </footer>
          
          <button (click)="analizarDisponibilidad()" class="mt-4 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-femsa-red hover:text-white dark:hover:bg-femsa-red dark:hover:text-white transition-all relative z-10 active:scale-95">
            <i class="fas fa-brain-circuit"></i> Diagnóstico IA
          </button>

          @if (analisisDisponibilidad()) {
            <div class="mt-4 p-4 bg-femsa-red/5 rounded-2xl border border-femsa-red/10 animate-fade-in relative z-10">
              <p class="text-[9px] font-black uppercase text-femsa-red tracking-widest mb-3">Factores Críticos:</p>
              <div class="space-y-2">
                @for (causa of analisisDisponibilidad().causas; track causa.desc) {
                  <div class="flex items-center justify-between text-[10px]">
                    <span class="text-slate-600 dark:text-slate-400 font-bold">{{ causa.desc }}</span>
                    <span class="text-femsa-red font-black">{{ causa.pct }}%</span>
                  </div>
                }
              </div>
            </div>
          }
        </article>

        <app-kpi-card title="Capacidad Operativa" subtitle="Estado actual de flota" [value]="operativeCount()" [unit]="'de ' + totalAssets()" status="info" statusText="Visualización Live" footerLabel="Unidades en Taller" [footerValue]="activeFailures().length" [trendLabel]="fleetCapacityLabel()"></app-kpi-card>
        
        <app-kpi-card title="Control de Costos" subtitle="Mantenimiento y Refacciones" [value]="formattedCost()" [unit]="costUnit()" [status]="budgetStatus()" [statusText]="budgetStatusText()" footerLabel="Budget Mensual" [footerValue]="(kpi().budgetMonth | currency) || '$0'" [trendLabel]="budgetVariance()"></app-kpi-card>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Live Workshop Table -->
        <div class="lg:col-span-2 bg-white dark:bg-white/5 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col overflow-hidden h-[600px]">
          <div class="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
            <div>
              <h3 class="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase">Monitor de Taller (Real-Time)</h3>
              <p class="text-xs text-slate-500 mt-1 font-medium">Gestión de activos en mantenimiento correctivo</p>
            </div>
            @if (activeFailures().length > 0) {
              <div class="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
                <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                <span class="text-[10px] font-black text-red-600 uppercase tracking-widest">{{ activeFailures().length }} Unidades en Atención</span>
              </div>
            }
          </div>
          <div class="flex-1 overflow-y-auto custom-scroll">
            <table class="w-full text-left">
              <thead class="bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] sticky top-0 z-10">
                <tr>
                  <th class="p-6 pl-8">Activo / Prioridad</th>
                  <th class="p-6">Falla Reportada</th>
                  <th class="p-6">Estado Actual</th>
                  <th class="p-6 text-center">MTTR (Time)</th>
                  <th class="p-6 text-right pr-8">Control</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                @for (f of activeFailures(); track f.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                    <td class="p-6 pl-8">
                      <div class="flex items-center gap-4">
                        <div [class]="'w-1.5 h-12 rounded-full ' + getPriorityColor(f.prioridad)"></div>
                        <div>
                          <div class="font-black text-slate-900 dark:text-white text-lg leading-none mb-2">{{ f.economico }}</div>
                          <span [class]="'text-[9px] font-black uppercase px-2 py-1 rounded-md border tracking-widest ' + getPriorityBadgeClass(f.prioridad)">{{ f.prioridad }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="p-6">
                      <div class="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">{{ f.fechaIngreso | date: 'dd MMM, HH:mm' }}</div>
                      <div class="text-sm font-bold text-slate-700 dark:text-slate-300 max-w-[240px] leading-snug">{{ f.falla }}</div>
                    </td>
                    <td class="p-6">
                      <span [class]="'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ' + getStatusBadgeClass(f)">
                        <span [class]="'w-1.5 h-1.5 rounded-full ' + getStatusDotClass(f)"></span>
                        {{ f.estatus === 'Abierta' ? 'Diagnóstico' : 'Reparación' }}
                      </span>
                    </td>
                    <td class="p-6 text-center">
                      <div class="flex flex-col items-center">
                        <span class="font-black text-slate-900 dark:text-white text-sm font-mono tracking-tighter">{{ getTimeInShop(f.fechaIngreso).text }}</span>
                        <span [class]="'text-[9px] font-black uppercase tracking-widest mt-1 ' + getTimeInShop(f.fechaIngreso).color">{{ getTimeInShop(f.fechaIngreso).label }}</span>
                      </div>
                    </td>
                    <td class="p-6 pr-8 text-right">
                      <button (click)="selectAsset(f.economico)" class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-femsa-red hover:text-white transition-all flex items-center justify-center shadow-sm">
                        <i class="fas fa-chevron-right"></i>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="py-32 text-center">
                      <div class="flex flex-col items-center justify-center opacity-40">
                        <div class="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/5 rounded-[32px] flex items-center justify-center mb-6 border border-emerald-100 dark:border-emerald-500/10">
                          <i class="fas fa-check-double text-3xl text-emerald-500"></i>
                        </div>
                        <h3 class="text-slate-900 dark:text-white font-black text-xl uppercase tracking-tight">Sin Unidades en Taller</h3>
                        <p class="text-slate-500 text-sm mt-2">La flota completa se encuentra operativa.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sidebar Widgets -->
        <div class="flex flex-col gap-8">
          <!-- Critical Issues -->
          <div class="bg-white dark:bg-white/5 rounded-[32px] border border-slate-200 dark:border-white/5 p-8 shadow-xl shadow-slate-200/20 dark:shadow-none">
            <div class="flex justify-between items-center mb-8">
              <h3 class="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Top Fallas Críticas</h3>
              <span class="text-[9px] font-black text-slate-400 uppercase bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full tracking-widest">30 Días</span>
            </div>
            <div class="space-y-6">
              <button (click)="filterByIssue('Hidráulico')" class="w-full text-left group transition-all">
                <div class="flex justify-between items-end mb-3">
                  <span class="text-xs font-black text-slate-700 dark:text-slate-300 group-hover:text-femsa-red transition-colors uppercase tracking-tight">Sistema Hidráulico</span>
                  <span class="text-xs font-black text-femsa-red">45%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                  <div class="bg-femsa-red h-full w-[45%] relative">
                    <div class="absolute inset-0 shimmer opacity-30"></div>
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-between">
                  <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">12 Incidentes</span>
                  <span class="text-[10px] text-femsa-red font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalles →</span>
                </div>
              </button>

              <button (click)="filterByIssue('Frenos')" class="w-full text-left group transition-all">
                <div class="flex justify-between items-end mb-3">
                  <span class="text-xs font-black text-slate-700 dark:text-slate-300 group-hover:text-amber-500 transition-colors uppercase tracking-tight">Frenos y Tracción</span>
                  <span class="text-xs font-black text-amber-500">20%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                  <div class="bg-amber-500 h-full w-[20%] relative">
                    <div class="absolute inset-0 shimmer opacity-30"></div>
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-between">
                  <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">8 Incidentes</span>
                  <span class="text-[10px] text-amber-500 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalles →</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Activity Timeline -->
          <div class="flex-1 bg-white dark:bg-white/5 rounded-[32px] border border-slate-200 dark:border-white/5 p-8 shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col">
            <div class="flex justify-between items-center mb-8">
              <h3 class="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Línea de Tiempo</h3>
              <button class="text-[9px] font-black text-femsa-red uppercase tracking-widest hover:underline">Ver Historial</button>
            </div>
            <div class="relative pl-6 border-l-2 border-slate-100 dark:border-white/5 space-y-8 flex-1">
              @for (event of recentEvents(); track $index) {
                <div class="relative group">
                  <div class="absolute -left-[35px] top-0 h-10 w-10 rounded-2xl border-4 border-white dark:border-[#0B0F19] flex items-center justify-center text-xs text-white shadow-xl transition-all group-hover:scale-110 group-hover:rotate-3" [ngClass]="event.color">
                    <i [class]="'fas ' + event.icon"></i>
                  </div>
                  <div class="pl-2">
                    <p class="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight group-hover:text-femsa-red transition-colors">{{ event.title }}</p>
                    <div class="flex items-center gap-3 mt-2">
                      <span class="text-[10px] text-slate-400 font-black font-mono">{{ event.time }}</span>
                      <span class="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                      <span class="text-[9px] bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">{{ event.user }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  dataService = inject(DataService);
  
  lastUpdate = signal(new Date());
  activeFailures = this.dataService.activeFailures;
  kpi = this.dataService.kpi;
  
  safetyStats = computed(() => ({
    daysWithoutAccident: 142,
    record: 365
  }));

  fleetAvailability = computed(() => {
    const total = this.dataService.assets().length;
    const active = total - this.activeFailures().length;
    return {
      percentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  });

  availabilityStatusText = computed(() => this.fleetAvailability().percentage > 90 ? 'Saludable' : 'Alerta');
  availabilityGap = computed(() => {
    const gap = 95 - this.fleetAvailability().percentage;
    return gap > 0 ? `-${gap}% vs Meta` : 'Meta Superada';
  });

  operativeCount = computed(() => this.dataService.assets().length - this.activeFailures().length);
  totalAssets = computed(() => this.dataService.assets().length);
  fleetCapacityLabel = computed(() => `${this.operativeCount()} Activos Online`);

  formattedCost = computed(() => {
    const cost = this.kpi().maintenanceCost;
    return cost > 1000 ? (cost / 1000).toFixed(1) : cost;
  });

  costUnit = computed(() => this.kpi().maintenanceCost > 1000 ? 'k USD' : 'USD');
  budgetStatus = computed(() => this.kpi().maintenanceCost > this.kpi().budgetMonth ? 'danger' : 'success');
  budgetStatusText = computed(() => this.budgetStatus() === 'danger' ? 'Sobre Presupuesto' : 'Bajo Presupuesto');
  budgetVariance = computed(() => {
    const variance = ((this.kpi().maintenanceCost / this.kpi().budgetMonth) * 100) - 100;
    return `${variance > 0 ? '+' : ''}${Math.round(variance)}% Var.`;
  });

  analisisDisponibilidad = signal<any>(null);

  recentEvents = signal([
    { title: 'MTTO Preventivo Finalizado', time: '10:45 AM', user: 'JUAN PEREZ', icon: 'fa-check', color: 'bg-emerald-500' },
    { title: 'Nueva Alerta de Sensor', time: '09:30 AM', user: 'SYSTEM', icon: 'fa-exclamation-triangle', color: 'bg-amber-500' },
    { title: 'Activo MT-802 Ingresado', time: '08:15 AM', user: 'CARLOS R.', icon: 'fa-wrench', color: 'bg-femsa-red' },
  ]);

  getPriorityColor(p: string) {
    switch (p) {
      case 'Alta': return 'bg-femsa-red';
      case 'Media': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  }

  getPriorityBadgeClass(p: string) {
    switch (p) {
      case 'Alta': return 'bg-femsa-red/10 text-femsa-red border-femsa-red/20';
      case 'Media': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  }

  getStatusBadgeClass(f: any) {
    return f.estatus === 'Abierta' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  }

  getStatusDotClass(f: any) {
    return f.estatus === 'Abierta' ? 'bg-amber-500' : 'bg-blue-500';
  }

  getTimeInShop(date: string) {
    const hours = Math.floor((new Date().getTime() - new Date(date).getTime()) / 3600000);
    return {
      text: `${hours}h`,
      label: hours > 24 ? 'Critical' : 'Normal',
      color: hours > 24 ? 'text-femsa-red' : 'text-slate-400'
    };
  }

  selectAsset(id: string) {
    window.dispatchEvent(new CustomEvent('asset-selected', { detail: id }));
  }

  downloadReport() {
    console.log('Descargando reporte ejecutivo...');
  }

  analizarDisponibilidad() {
    this.analisisDisponibilidad.set({
      causas: [
        { desc: 'Falta de Refacciones Críticas', pct: 45 },
        { desc: 'Saturación en Taller Central', pct: 30 },
        { desc: 'Demoras en Diagnóstico Externo', pct: 25 }
      ]
    });
  }

  filterByIssue(issue: string) {
    console.log('Filtrando por:', issue);
  }
}
