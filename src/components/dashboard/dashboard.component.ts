import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { KpiCardComponent, KpiStatus } from '../ui/kpi-card.component';
import { ForkliftFailureEntry } from '../../types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, DatePipe, CurrencyPipe],
  template: `
    <div class="space-y-6 pb-10">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Centro de Monitoreo (NOC)</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span class="font-bold text-slate-700 dark:text-slate-300">Operación Estable</span>
            <span class="mx-1 text-slate-300">|</span>
            <i class="far fa-clock text-slate-400"></i>
            <span class="text-xs">Actualizado: {{ lastUpdate() | date: 'HH:mm:ss' }}</span>
          </p>
        </div>
        <div class="flex gap-2">
          <button (click)="downloadReport()" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 transition shadow-sm">
            <i class="fas fa-download mr-2"></i> Reporte PDF
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <app-kpi-card title="Seguridad" subtitle="Días sin incidentes" [value]="safetyStats().daysWithoutAccident" unit="días" status="success" statusText="En buen nivel" footerLabel="Meta Histórica" [footerValue]="safetyStats().record + ' días'" [trendLabel]="'Faltan ' + (safetyStats().record - safetyStats().daysWithoutAccident) + ' para récord'"></app-kpi-card>
        
        <article class="h-full rounded-2xl border shadow-lg p-4 flex flex-col gap-3 transition-all hover:shadow-xl relative overflow-hidden group bg-white dark:bg-slate-900/60 border-red-500">
          <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          <header class="flex items-start justify-between relative z-10">
            <div>
              <h2 class="text-sm font-medium text-slate-500 dark:text-slate-300">Disponibilidad</h2>
              <p class="text-xs text-slate-400 mt-0.5">Flota operativa efectiva</p>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full text-[10px] font-bold px-2.5 py-1 border backdrop-blur-sm bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/40">
              <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
              {{ availabilityStatusText() }}
            </span>
          </header>
          <div class="flex items-baseline gap-2 mt-1 relative z-10">
            <span class="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-50">{{ fleetAvailability().percentage }}</span>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">%</span>
          </div>
          <footer class="mt-auto flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700/50 relative z-10">
            <span>Meta 95%: <span class="text-slate-700 dark:text-slate-200 font-medium">83%</span></span>
            <span class="text-red-500">{{ availabilityGap() }}</span>
          </footer>
          <button class="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2" (click)="analizarDisponibilidad()">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd"></path></svg> Analizar Causas con IA
          </button>
          @if (analisisDisponibilidad()) {
            <div class="mt-3 bg-red-50 p-3 rounded text-xs">
              <p class="font-semibold mb-2">🤖 Causas Principales:</p>
              <ul class="space-y-1">
                @for (causa of analisisDisponibilidad().causas; track causa.desc) {
                  <li>• {{ causa.desc }} ({{ causa.pct }}%)</li>
                }
              </ul>
              <button (click)="navigateToMaintenance()" class="text-red-600 font-semibold mt-2 inline-block hover:text-red-700">Ver detalles →</button>
            </div>
          }
        </article>

        <app-kpi-card title="Flota Activa" subtitle="Estado actual de montacargas" [value]="operativeCount()" [unit]="'de ' + totalAssets()" status="info" statusText="Vista general" footerLabel="En Taller" [footerValue]="activeFailures().length + (activeFailures().length === 1 ? ' unidad' : ' unidades')" [trendLabel]="fleetCapacityLabel()"></app-kpi-card>
        
        <app-kpi-card title="Costo Mensual" subtitle="Mantenimiento y refacciones" [value]="formattedCost()" [unit]="costUnit()" [status]="budgetStatus()" [statusText]="budgetStatusText()" footerLabel="Presupuesto" [footerValue]="(kpi().budgetMonth | currency) || '$0'" [trendLabel]="budgetVariance()"></app-kpi-card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col overflow-hidden h-[500px]">
          <div class="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
            <div>
              <h3 class="font-bold text-slate-800 dark:text-white flex items-center gap-2"><i class="fas fa-wrench text-slate-400"></i> Taller en Vivo</h3>
              <p class="text-xs text-slate-500 mt-1">Órdenes activas y tiempos de respuesta</p>
            </div>
            @if (activeFailures().length > 0) {
              <span class="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full border border-red-100 dark:border-red-500/20 animate-pulse">{{ activeFailures().length }} {{ activeFailures().length === 1 ? 'unidad' : 'unidades' }} en atención</span>
            }
          </div>
          <div class="flex-1 overflow-y-auto custom-scroll relative">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10 shadow-sm">
                <tr>
                  <th class="p-4 pl-6">Prioridad / Unidad</th>
                  <th class="p-4">Falla Reportada</th>
                  <th class="p-4">Estado</th>
                  <th class="p-4 text-center">SLA (Tiempo)</th>
                  <th class="p-4 text-right pr-6">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
                @for (f of activeFailures(); track f.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td class="p-4 pl-6">
                      <div class="flex items-center gap-3">
                        <div [class]="'w-1.5 h-10 rounded-full ' + getPriorityColor(f.prioridad)"></div>
                        <div>
                          <div class="font-black text-slate-800 dark:text-white text-base">{{ f.economico }}</div>
                          <span [class]="'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ' + getPriorityBadgeClass(f.prioridad)">{{ f.prioridad }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="p-4">
                      <div class="text-xs text-slate-500 font-medium">{{ f.fechaIngreso | date: 'dd MMM, HH:mm' }}</div>
                      <div class="text-sm font-bold text-slate-700 dark:text-slate-300 max-w-[220px] truncate cursor-help" [title]="f.falla">{{ f.falla }}</div>
                    </td>
                    <td class="p-4">
                      <span [class]="'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ' + getStatusBadgeClass(f)">
                        <span [class]="'w-1.5 h-1.5 rounded-full ' + getStatusDotClass(f)"></span>
                        {{ f.estatus === 'Abierta' ? 'Diagnóstico' : 'En Reparación' }}
                      </span>
                    </td>
                    <td class="p-4 text-center">
                      <div class="flex flex-col items-center">
                        <span class="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{{ getTimeInShop(f.fechaIngreso).text }}</span>
                        <span [class]="'text-[10px] font-bold uppercase ' + getTimeInShop(f.fechaIngreso).color">{{ getTimeInShop(f.fechaIngreso).label }}</span>
                      </div>
                    </td>
                    <td class="p-4 pr-6 text-right">
                      <button (click)="selectAsset(f.economico)" class="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:text-[#ce1126] hover:border-[#ce1126] px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm group-hover:shadow-md">Ver Detalle <i class="fas fa-arrow-right ml-1"></i></button>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="py-20 text-center"><div class="flex flex-col items-center justify-center opacity-60"><div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-100"><i class="fas fa-check text-2xl text-emerald-500"></i></div><h3 class="text-slate-800 dark:text-white font-bold text-lg">Sin unidades en taller</h3><p class="text-slate-500 text-sm mt-1 mb-4">La flota opera al 100% de capacidad.</p></div></td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex flex-col gap-6">
          <div class="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-5">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-slate-800 dark:text-white text-sm">Top 3 Problemas</h3>
              <span class="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Últimos 30 días</span>
            </div>
            <div class="space-y-3">
              <button (click)="filterByIssue('Hidráulico')" class="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 group hover:border-red-200 transition-colors cursor-pointer relative">
                <div class="flex justify-between items-start mb-2"><span class="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-[#ce1126] transition-colors">Sistema Hidráulico</span><span class="text-xs font-black text-red-500">45%</span></div>
                <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3"><div class="bg-red-500 h-full w-[45%]"></div></div>
                <div class="flex justify-between items-center"><span class="text-[10px] text-slate-400 font-medium">12 incidentes reportados</span><span class="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg text-slate-600 group-hover:text-[#ce1126] group-hover:border-red-100 font-bold shadow-sm transition-all group-hover:shadow-md flex items-center gap-1">Ver equipos <i class="fas fa-arrow-right text-[9px]"></i></span></div>
              </button>
              <button (click)="filterByIssue('Frenos')" class="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 group hover:border-amber-200 transition-colors cursor-pointer relative">
                <div class="flex justify-between items-start mb-2"><span class="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-amber-600 transition-colors">Frenos / Desgaste</span><span class="text-xs font-black text-amber-500">20%</span></div>
                <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3"><div class="bg-amber-500 h-full w-[20%]"></div></div>
                <div class="flex justify-between items-center"><span class="text-[10px] text-slate-400 font-medium">8 incidentes reportados</span><span class="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg text-slate-600 group-hover:text-amber-600 group-hover:border-amber-100 font-bold shadow-sm transition-all group-hover:shadow-md flex items-center gap-1">Ver equipos <i class="fas fa-arrow-right text-[9px]"></i></span></div>
              </button>
            </div>
          </div>

          <div class="flex-1 bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-5 flex flex-col">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-slate-800 dark:text-white text-sm">Eventos Recientes</h3>
              <button class="text-[10px] font-bold text-[#ce1126] hover:underline">Ver todo</button>
            </div>
            <div class="relative pl-4 border-l border-slate-200 dark:border-slate-700 space-y-6">
              @for (event of recentEvents(); track $index) {
                <div class="relative group">
                  <div class="absolute -left-[25px] top-0 h-7 w-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white shadow-sm transition-transform group-hover:scale-110" [ngClass]="event.color"><i [class]="'fas ' + event.icon"></i></div>
                  <p class="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{{ event.title }}</p>
                  <div class="flex items-center gap-2 mt-1"><span class="text-[10px] text-slate-400 font-mono">{{ event.time }}</span><span class="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{{ event.user }}</span></div>
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
  kpi = this.dataService.kpiData;
  safetyStats = this.dataService.safetyStats;
  fleetAvailability = this.dataService.fleetAvailability;
  activeFailures = computed(() => this.dataService.forkliftFailures().filter(f => f.estatus !== 'Cerrada'));
  operativeCount = computed(() => this.dataService.assets().filter(a => a.status.name === 'Operativo').length);
  totalAssets = computed(() => this.dataService.assets().length);
  lastUpdate = this.dataService.lastUpdate;
  analisisDisponibilidad = signal<any>(null);

  availabilityStatusText = computed(() => {
    const p = this.fleetAvailability().percentage;
    if (p >= 95) return 'Meta Cumplida';
    if (p >= 85) return 'En Riesgo';
    return 'Crítico';
  });

  availabilityGap = computed(() => {
    const p = this.fleetAvailability().percentage;
    const diff = p - 95;
    const sign = diff > 0 ? '+' : '';
    return `Brecha: ${sign}${diff.toFixed(0)} pts`;
  });

  fleetCapacityLabel = computed(() => {
    const total = this.totalAssets();
    if (total === 0) return '0% capacidad';
    const operative = this.operativeCount();
    const pct = Math.round((operative / total) * 100);
    return `${pct}% de capacidad operativa`;
  });

  formattedCost = computed(() => {
    const cost = this.kpi().totalCostMonth;
    return cost === 0 ? 'Sin gastos' : '$' + cost.toLocaleString('en-US');
  });

  costUnit = computed(() => {
    return this.kpi().totalCostMonth === 0 ? 'registrados este mes' : 'USD';
  });

  budgetStatus = computed<KpiStatus>(() => {
    const cost = this.kpi().totalCostMonth;
    const budget = this.kpi().budgetMonth;
    if (cost === 0) return 'neutral';
    if (cost > budget) return 'danger';
    if (cost > budget * 0.9) return 'warning';
    return 'success';
  });

  budgetStatusText = computed(() => {
    const cost = this.kpi().totalCostMonth;
    const budget = this.kpi().budgetMonth;
    if (cost === 0) return 'Presupuesto Intacto';
    if (cost > budget) return 'Excedido';
    return 'Bajo presupuesto';
  });

  budgetVariance = computed(() => {
    const cost = this.kpi().totalCostMonth;
    const budget = this.kpi().budgetMonth;
    if (cost === 0) return 'Disponible: 100%';
    const variance = ((cost - budget) / budget) * 100;
    return variance > 0 ? `+${variance.toFixed(1)}% vs Presupuesto` : `${variance.toFixed(1)}% vs Presupuesto`;
  });

  recentEvents = computed(() => [
    { title: 'Unidad 35526 ingresó a Taller', time: 'Hace 15 min', user: 'Op. Móvil', color: 'bg-red-500', icon: 'fa-exclamation-circle' },
    { title: 'Refacción "Kit Sellos" solicitada', time: 'Hace 45 min', user: 'Toyota Tech', color: 'bg-blue-500', icon: 'fa-box-open' },
    { title: 'Turno Matutino inició operaciones', time: '06:00 AM', user: 'Sistema', color: 'bg-emerald-500', icon: 'fa-check' }
  ]);

  selectAsset(id: string) { window.dispatchEvent(new CustomEvent('asset-selected', { detail: id })); }
  filterByIssue(issue: string) { alert(`[DEMO] Filtrando activos con fallas en: ${issue}`); }
  downloadReport() { window.print(); }
  analizarDisponibilidad() {
    this.analisisDisponibilidad.set({
      causas: [
        { desc: '3 unidades esperando refacciones', pct: 40 },
        { desc: '2 mantenimientos preventivos vencidos', pct: 27 },
        { desc: '1 falla hidráulica compleja', pct: 33 }
      ]
    });
  }

  getTimeInShop(dateStr: string) {
    const start = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffHrs = Math.floor((now - start) / (1000 * 60 * 60));
    let text, label, color;
    if (diffHrs < 1) { text = '< 1h'; label = 'A tiempo'; color = 'text-emerald-500'; }
    else if (diffHrs < 24) { text = `${diffHrs}h`; label = 'En proceso'; color = 'text-blue-500'; }
    else { const days = Math.floor(diffHrs / 24); text = `${days}d ${diffHrs % 24}h`; label = 'Demorado'; color = 'text-amber-500'; }
    if (diffHrs > 48) { label = 'Crítico'; color = 'text-red-500'; }
    return { text, label, color };
  }

  getStatusBadgeClass(f: ForkliftFailureEntry): string {
    if (f.estatus === 'Abierta') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
  }
  getStatusDotClass(f: ForkliftFailureEntry): string { return f.estatus === 'Abierta' ? 'bg-amber-500' : 'bg-blue-500'; }
  getPriorityColor(p: string): string { if (p === 'Alta') return 'bg-red-500'; if (p === 'Media') return 'bg-amber-400'; return 'bg-blue-400'; }
  getPriorityBadgeClass(p: string): string {
    if (p === 'Alta') return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    if (p === 'Media') return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
    return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
  }
  navigateToMaintenance() { window.dispatchEvent(new CustomEvent('navigate', { detail: 'maintenance-compliance' })); }
}
