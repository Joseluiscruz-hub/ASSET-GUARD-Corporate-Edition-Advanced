import { Component, ElementRef, ViewChild, effect, inject, computed } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Asset, FailureReport } from '../../types';
import { CommonModule, CurrencyPipe } from '@angular/common';

interface ChartScaleOptions {
  grid?: { color?: string; drawBorder?: boolean; display?: boolean };
  ticks?: { color?: string; font?: { size: number } };
}

interface ChartLike {
  data: {
    labels?: string[];
    datasets: Array<{
      data: number[];
      backgroundColor?: string[];
    }>;
  };
  options?: {
    scales?: {
      x?: ChartScaleOptions;
      y?: ChartScaleOptions;
    };
  };
  update: () => void;
}

interface ChartConstructor {
  new (element: HTMLCanvasElement, config: unknown): ChartLike;
  getChart: (element: HTMLCanvasElement) => ChartLike | undefined;
}

declare const Chart: ChartConstructor;

interface AvailabilityView {
  percentage: number;
  label: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div
      class="min-h-full transition-colors duration-500 ease-in-out font-sans relative"
      [class.bg-[#0a0e14]]="plantMode()"
      [class.bg-[#f1f5f9]]="!plantMode()"
      [class.p-4]="plantMode()"
      [class.p-6]="!plantMode()"
    >
      <!-- Header / Toolbar -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-4">
          <h2
            class="text-2xl font-black uppercase tracking-widest flex items-center gap-2"
            [class.text-[#ce1126]]="plantMode()"
            [class.text-slate-800]="!plantMode()"
          >
            <i class="fas fa-network-wired"></i> NOC - CENTER
          </h2>
          <div class="flex gap-2">
            <button
              (click)="togglePlantMode()"
              class="px-4 py-1.5 text-xs rounded-full font-bold transition-all border uppercase tracking-wide flex items-center gap-2"
              [class.bg-[#ce1126]]="plantMode()"
              [class.text-white]="plantMode()"
              [class.border-[#ce1126]]="plantMode()"
              [class.bg-white]="!plantMode()"
              [class.text-slate-600]="!plantMode()"
              [class.border-slate-300]="!plantMode()"
            >
              <i class="fas" [class.fa-tv]="plantMode()" [class.fa-desktop]="!plantMode()"></i>
              {{ plantMode() ? 'Modo Planta' : 'Modo Gestión' }}
            </button>

            <!-- Kiosk Toggle -->
            <button
              (click)="toggleKiosk()"
              class="px-4 py-1.5 text-xs rounded-full font-bold transition-all border uppercase tracking-wide flex items-center gap-2 bg-black text-white hover:bg-gray-800"
            >
              <i class="fas fa-play"></i> Quiosco TV
            </button>
          </div>
        </div>
        <div
          class="text-xs font-bold font-mono opacity-60"
          [class.text-white]="plantMode()"
          [class.text-slate-500]="!plantMode()"
        >
          SYNC: {{ now | date: 'mediumTime' }}
        </div>
      </div>

      <!-- BENTO GRID CONTAINER -->
      <div class="bento-grid">
        <!-- === NIVEL 1: SEGURIDAD (Priority 1) === -->
        <div
          class="col-span-12 lg:col-span-6 card-kpi priority-1 group"
          [class.text-white]="plantMode()"
          [class.text-slate-800]="!plantMode()"
        >
          <div
            class="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"
          >
            <i class="fas fa-shield-alt text-8xl text-emerald-500"></i>
          </div>
          <div>
            <h3
              class="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1 flex items-center gap-2"
            >
              <i class="fas fa-hard-hat"></i> Seguridad Industrial
            </h3>
            <div class="flex items-baseline gap-2 mt-2">
              <div
                class="text-5xl font-black tracking-tighter"
                [class.text-white]="plantMode()"
                [class.text-emerald-900]="!plantMode()"
              >
                {{ safetyStats().daysWithoutAccident }}
              </div>
              <span class="text-xl font-bold opacity-50 uppercase">Días</span>
            </div>
            <p class="text-emerald-500 text-sm mt-1 font-bold flex items-center gap-1">
              <i class="fas fa-check-circle"></i> Operación Segura
            </p>
            <p class="text-xs opacity-60 mt-1">Sin incidentes reportados en turno actual</p>
          </div>
          <!-- Progress Bar for Record -->
          <div
            class="w-full bg-gray-200/20 h-2 mt-6 rounded-full overflow-hidden border border-emerald-500/20"
          >
            <div
              class="bg-emerald-500 h-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              [style.width.%]="(safetyStats().daysWithoutAccident / safetyStats().record) * 100"
            ></div>
          </div>
          <div class="flex justify-between text-[10px] uppercase font-bold opacity-50 mt-2">
            <span>Meta Diaria</span>
            <span>Récord Planta: {{ safetyStats().record }}</span>
          </div>
        </div>

        <!-- === NIVEL 2: CALIDAD (Priority 2) === -->
        <div
          class="col-span-12 md:col-span-6 lg:col-span-3 card-kpi priority-2 group"
          [class.text-white]="plantMode()"
          [class.text-slate-800]="!plantMode()"
        >
          <div class="flex justify-between items-start mb-4">
            <h3
              class="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2"
            >
              <i class="fas fa-star"></i> Calidad
            </h3>
            <span
              class="text-[10px] font-bold text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded border border-cyan-500/30"
              >KPI</span
            >
          </div>
          <div class="relative flex items-center justify-center h-32">
            <canvas #qualityChart></canvas>
            <div
              class="absolute inset-0 flex items-center justify-center flex-col pointer-events-none"
            >
              <span class="text-2xl font-black">{{ fleetAvailability().percentage }}%</span>
              <span class="text-[8px] uppercase font-bold opacity-50 tracking-wider"
                >Disponibilidad</span
              >
            </div>
          </div>
          <p class="text-center text-[10px] opacity-50 mt-2">Cumplimiento de Mantenimiento</p>
        </div>

        <!-- === NIVEL 3: VOLUMEN (Priority 3) === -->
        <div
          class="col-span-12 md:col-span-6 lg:col-span-3 card-kpi priority-3 group"
          [class.text-white]="plantMode()"
          [class.text-slate-800]="!plantMode()"
        >
          <h3
            class="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2 flex items-center gap-2"
          >
            <i class="fas fa-cubes"></i> Volumen
          </h3>
          <div class="mt-2 relative z-10">
            <div class="text-4xl font-black">
              {{ operativeCount() }}
              <span class="text-lg opacity-40 font-bold">/ {{ assets().length }}</span>
            </div>
            <p class="text-xs text-yellow-500 uppercase font-bold mt-1">Unidades Operativas</p>
          </div>
          <div class="absolute right-2 bottom-2 p-4 opacity-10">
            <i class="fas fa-dolly text-6xl"></i>
          </div>
          <div class="mt-auto pt-4">
            <div
              class="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 flex justify-between items-center"
            >
              <div>
                <p class="text-[9px] opacity-60 uppercase font-bold">MTTR (Reparación)</p>
                <p class="text-lg font-bold text-yellow-400">{{ kpi().mttr }} h</p>
              </div>
              <i class="fas fa-stopwatch text-yellow-500 text-xl"></i>
            </div>
          </div>
        </div>

        <!-- === NIVEL 4: COSTO (Priority 4) === -->
        <div
          class="col-span-12 card-kpi priority-4 group flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          [class.text-white]="plantMode()"
          [class.text-slate-800]="!plantMode()"
        >
          <div class="flex-1">
            <h3
              class="text-xs font-bold uppercase tracking-widest text-red-500 mb-2 flex items-center gap-2"
            >
              <i class="fas fa-chart-line"></i> Eficiencia de Costos
            </h3>
            <div class="flex flex-wrap items-baseline gap-4">
              <span
                class="text-4xl font-black"
                [class.text-white]="plantMode()"
                [class.text-slate-900]="!plantMode()"
                >{{ kpi().totalCostMonth | currency }}</span
              >
              <span class="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                <i class="fas fa-arrow-down mr-1"></i> 4.2% vs Mes Anterior
              </span>
            </div>
            <p class="text-xs opacity-50 mt-1">
              Presupuesto asignado: {{ kpi().budgetMonth | currency }}
            </p>
          </div>

          <!-- Gemini Analysis Box -->
          <div class="flex-[2] w-full md:border-l pl-0 md:pl-6 border-slate-500/20">
            <p class="text-[10px] font-bold text-red-500 uppercase mb-2 flex items-center gap-1">
              <i class="fas fa-robot"></i> Análisis Gemini AI
            </p>
            <div
              class="relative bg-gradient-to-r from-red-500/10 to-transparent p-3 rounded-lg border-l-2 border-red-500"
            >
              <p class="text-sm leading-relaxed italic opacity-80">"{{ geminiCostAnalysis() }}"</p>
            </div>
          </div>
        </div>

        <!-- 2. TOYOTA LIVE FEED (Horizontal Scroll) -->
        <div
          class="col-span-12 lg:col-span-8 card-kpi p-0 relative overflow-hidden flex flex-col min-h-[300px]"
          [class.text-white]="plantMode()"
          [class.text-slate-800]="!plantMode()"
        >
          <div class="p-6 pb-2">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold flex items-center gap-3 uppercase tracking-wide text-sm">
                <span class="relative flex h-3 w-3">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                  ></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-[#ce1126]"></span>
                </span>
                Taller en Vivo (Toyota Live)
              </h3>
              <span class="text-[10px] font-mono opacity-50 bg-slate-500/20 px-2 py-1 rounded"
                >{{ activeFailures().length }} Tickets</span
              >
            </div>
          </div>

          <!-- Horizontal Scroll Container -->
          <div class="flex-1 overflow-x-auto p-6 pt-0 custom-scroll snap-x flex gap-4">
            @if (activeFailures().length === 0) {
              <div
                class="w-full flex flex-col items-center justify-center opacity-40 border-2 border-dashed rounded-xl border-slate-500/30"
              >
                <i class="fas fa-clipboard-check text-4xl mb-2"></i>
                <p class="font-bold uppercase text-xs">Sin reparaciones activas</p>
              </div>
            }

            @for (f of activeFailures(); track f.id) {
              <div
                class="min-w-[280px] max-w-[280px] p-4 rounded-xl border flex flex-col justify-between snap-center transition-all hover:translate-y-[-2px]"
                [class.bg-[#0f172a]]="plantMode()"
                [class.border-slate-700]="plantMode()"
                [class.bg-white]="!plantMode()"
                [class.border-slate-200]="!plantMode()"
                [class.shadow-md]="!plantMode()"
              >
                <div>
                  <div class="flex justify-between items-start mb-2">
                    <span class="font-black text-xl text-[#ce1126]">{{ f.economico }}</span>
                    <span
                      class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                      [class.bg-red-500]="f.prioridad === 'Alta'"
                      [class.text-white]="f.prioridad === 'Alta'"
                      [class.bg-orange-500]="f.prioridad === 'Media'"
                      [class.text-white]="f.prioridad === 'Media'"
                    >
                      {{ f.prioridad }}
                    </span>
                  </div>
                  <p class="text-xs font-medium leading-snug mb-3 line-clamp-2 opacity-80">
                    {{ f.falla }}
                  </p>

                  <div class="text-[10px] p-2 rounded bg-slate-500/10 mb-2">
                    <i class="fas fa-clock mr-1"></i> Ingreso: {{ f.fechaIngreso | date: 'HH:mm' }}
                  </div>
                </div>

                <button
                  (click)="closeFailure(f.id)"
                  class="w-full mt-2 bg-green-600/90 hover:bg-green-600 text-white text-[10px] font-bold py-2 rounded uppercase transition-colors"
                >
                  Liberar Unidad
                </button>
              </div>
            }
          </div>
        </div>

        <!-- 3. INVENTORY LIST (Vertical) -->
        <div
          class="col-span-12 lg:col-span-4 card-kpi p-0 overflow-hidden flex flex-col max-h-[300px]"
          [class.text-white]="plantMode()"
          [class.text-slate-800]="!plantMode()"
        >
          <div class="p-4 border-b border-slate-500/20 bg-slate-500/5">
            <h3 class="text-xs font-bold uppercase tracking-wide opacity-80">Inventario Flota</h3>
          </div>

          <div class="overflow-y-auto custom-scroll p-2 flex-1">
            <div class="grid grid-cols-1 gap-2">
              @for (m of assets(); track m.id) {
                <div
                  (click)="selectAsset(m)"
                  class="p-2.5 rounded-lg border text-xs flex justify-between items-center transition-colors hover:bg-slate-500/10 cursor-pointer border-transparent"
                  [class.border-l-2]="true"
                  [class.border-l-green-500]="m.status.name === 'Operativo'"
                  [class.border-l-red-500]="m.status.name === 'Taller'"
                >
                  <div class="flex items-center gap-3">
                    <span class="font-black font-mono">{{ m.id }}</span>
                    <span class="opacity-60">{{ m.model }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    @if (m.status.name === 'Taller') {
                      <i class="fas fa-tools text-red-500 text-[10px]"></i>
                    }
                    <span class="opacity-70">{{ m.status.name }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- 4. ANALYTICS / PARETO (Expanded) -->
        <div
          class="col-span-12 card-kpi p-6"
          [class.text-white]="plantMode()"
          [class.text-slate-800]="!plantMode()"
        >
          <div class="flex justify-between items-center mb-4">
            <h3
              class="text-xs font-bold flex items-center gap-2 uppercase tracking-wide opacity-80"
            >
              <i class="fas fa-chart-bar text-[#ce1126]"></i> Pareto de Fallas
            </h3>
          </div>
          <div class="relative h-48 w-full">
            <canvas #paretoChart></canvas>
          </div>
        </div>
      </div>

      <!-- *** KIOSK MODE OVERLAY *** -->
      @if (isKioskMode()) {
        <div
          class="fixed inset-0 z-50 bg-[#0a0e14] text-white flex flex-col items-center justify-center p-8 font-sans overflow-hidden cursor-none"
        >
          <!-- Exit Button (Subtle) -->
          <button
            (click)="toggleKiosk()"
            class="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"
          >
            <i class="fas fa-times text-2xl"></i>
          </button>

          <!-- SLIDE 0: AVAILABILITY -->
          @if (activeSlide() === 0) {
            <div
              class="animate-fade-in flex flex-col items-center justify-center w-full h-full text-center"
            >
              <h2 class="text-4xl font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">
                Estatus de Flota en Tiempo Real
              </h2>

              <div class="flex items-center justify-center gap-12 scale-150 transform">
                <div
                  class="text-[12rem] font-black leading-none"
                  [style.color]="fleetAvailability().color"
                >
                  {{ fleetAvailability().percentage }}%
                </div>
                <div class="text-left flex flex-col gap-4">
                  <div class="text-6xl font-bold uppercase">{{ fleetAvailability().label }}</div>
                  <div class="text-3xl text-slate-400">
                    {{ operativeCount() }} / {{ assets().length }} Unidades
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- SLIDE 1: PRODUCTIVITY (GAMIFICATION) -->
          @if (activeSlide() === 1) {
            <div class="animate-fade-in w-full max-w-6xl">
              <h2
                class="text-5xl font-black text-center mb-16 uppercase tracking-wider text-orange-500"
              >
                <i class="fas fa-trophy text-yellow-400 mr-4"></i> Líderes de Productividad
              </h2>

              <div class="grid grid-cols-1 gap-6">
                <!-- 1st Place -->
                <div
                  class="bg-gradient-to-r from-orange-600 to-orange-500 p-12 rounded-[3rem] shadow-2xl flex justify-between items-center transform hover:scale-105 transition-transform duration-500"
                >
                  <div class="flex items-center gap-8">
                    <span class="text-8xl font-black text-white/20">#1</span>
                    <div>
                      <h3 class="text-6xl font-black text-white leading-tight">
                        {{ crewStats()[0].name }}
                      </h3>
                      <p class="text-2xl text-orange-100 font-bold uppercase mt-2">
                        Puntuación: {{ crewStats()[0].score }}/100
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-7xl font-black text-white">{{ crewStats()[0].pallets }}</div>
                    <div class="text-xl font-bold uppercase text-orange-200">Pallets Movidos</div>
                  </div>
                </div>

                <!-- Other Places -->
                <div class="grid grid-cols-2 gap-6">
                  @for (crew of crewStats().slice(1); track crew.rank) {
                    <div
                      class="bg-white/10 p-8 rounded-3xl flex justify-between items-center backdrop-blur-md border border-white/5"
                    >
                      <div class="flex items-center gap-4">
                        <span class="text-4xl font-black text-white/40">#{{ crew.rank }}</span>
                        <span class="text-3xl font-bold">{{ crew.name }}</span>
                      </div>
                      <span class="text-4xl font-mono font-bold text-orange-400">{{
                        crew.pallets
                      }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- SLIDE 2: SAFETY -->
          @if (activeSlide() === 2) {
            <div class="animate-fade-in flex flex-col items-center justify-center w-full h-full">
              <!-- Counter Circle -->
              <div
                class="w-[30rem] h-[30rem] rounded-full border-[1.5rem] flex flex-col items-center justify-center relative bg-green-900/20"
                [class.border-green-500]="safetyStats().daysWithoutAccident > 0"
                [class.border-red-500]="safetyStats().daysWithoutAccident === 0"
              >
                <span class="text-[12rem] font-black leading-none text-white">
                  {{ safetyStats().daysWithoutAccident }}
                </span>
                <span class="text-3xl font-bold uppercase tracking-widest text-green-400 mt-4"
                  >Días sin Accidentes</span
                >

                <!-- Record Badge -->
                <div
                  class="absolute -bottom-12 bg-slate-800 px-8 py-3 rounded-full border border-slate-600"
                >
                  <span class="text-xl text-slate-400 font-bold"
                    >Récord Planta: <span class="text-white">{{ safetyStats().record }}</span></span
                  >
                </div>
              </div>

              <!-- Announcement Banner -->
              <div
                class="mt-24 w-full max-w-5xl bg-yellow-500 text-black p-10 rounded-2xl shadow-xl flex items-center gap-8 border-l-[1rem] border-yellow-700 animate-pulse"
              >
                <i class="fas fa-bullhorn text-6xl opacity-80"></i>
                <div>
                  <h3 class="text-xl font-black uppercase opacity-60 mb-1">Anuncio de Seguridad</h3>
                  <p class="text-4xl font-bold leading-tight">{{ safetyStats().announcement }}</p>
                </div>
              </div>
            </div>
          }

          <!-- Progress Bar -->
          <div
            class="absolute bottom-0 left-0 h-2 bg-[#ce1126] transition-all duration-[15000ms] ease-linear w-full opacity-50"
          ></div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* BENTO GRID ENGINE */
      .bento-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        grid-auto-rows: minmax(100px, auto);
        gap: 1.25rem;
      }

      .col-span-12 {
        grid-column: span 12;
      }

      @media (min-width: 1024px) {
        .lg\\:col-span-3 {
          grid-column: span 3;
        }
        .lg\\:col-span-4 {
          grid-column: span 4;
        }
        .lg\\:col-span-6 {
          grid-column: span 6;
        }
        .lg\\:col-span-8 {
          grid-column: span 8;
        }
      }

      /* GLASSMORPHISM CARDS */
      .card-kpi {
        position: relative;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 1.25rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease;
        display: flex;
        flex-direction: column;
      }

      .card-kpi:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
        z-index: 10;
      }

      /* DARK MODE OVERRIDES (PLANT MODE) */
      .bg-\\[\\#0a0e14\\] .card-kpi {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: none;
      }

      .bg-\\[\\#0a0e14\\] .card-kpi:hover {
        background: rgba(30, 41, 59, 0.6);
        border-color: rgba(255, 255, 255, 0.1);
      }

      /* PRIORITY STRIPS */
      .priority-1 {
        border-left: 4px solid #10b981;
      } /* Security - Green */
      .priority-2 {
        border-left: 4px solid #06b6d4;
      } /* Quality - Cyan */
      .priority-3 {
        border-left: 4px solid #eab308;
      } /* Volume - Yellow */
      .priority-4 {
        border-left: 4px solid #ef4444;
      } /* Cost - Red */

      /* SCROLLBARS */
      .custom-scroll::-webkit-scrollbar {
        height: 6px;
        width: 6px;
      }
      .custom-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scroll::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.5);
        border-radius: 3px;
      }

      /* ANIMATIONS */
      .animate-fade-in {
        animation: fadeIn 0.8s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class DashboardComponent {
  private dataService = inject(DataService);

  // Signals
  kpi = this.dataService.kpiData;
  fleetAvailability = this.dataService.fleetAvailability;
  assets = this.dataService.assets;
  forkliftFailures = this.dataService.forkliftFailures;
  plantMode = this.dataService.plantMode;
  topOperators = this.dataService.topOperators;

  // KIOSK Signals
  isKioskMode = this.dataService.isKioskMode;
  activeSlide = this.dataService.activeSlide;
  safetyStats = this.dataService.safetyStats;
  crewStats = this.dataService.crewLeaderboard;

  now = new Date();

  // Computed
  activeFailures = computed(() => this.forkliftFailures().filter((f) => f.estatus !== 'Cerrada'));

  operativeCount = computed(
    () => this.assets().filter((a) => a.status.name === 'Operativo').length
  );

  // Mock Gemini Analysis for Cost Card
  geminiCostAnalysis = computed(() => {
    const kpi = this.kpi();
    const ratio = kpi.totalCostMonth / kpi.budgetMonth;
    if (ratio < 0.8)
      return 'Gasto controlado. Tendencia positiva de ahorro detectada en mantenimiento correctivo.';
    if (ratio < 1.0)
      return 'En línea con el presupuesto. Se recomienda monitorear refacciones de frenos.';
    return 'Alerta: Proyección de sobrecosto por reparaciones mayores no programadas.';
  });

  @ViewChild('paretoChart') paretoCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('qualityChart') qualityCanvas!: ElementRef<HTMLCanvasElement>;

  private chartUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    setInterval(() => {
      this.now = new Date();
    }, 60000);

    effect(() => {
      // Re-render charts on data change
      const reports = this.dataService.reports();
      const isDark = this.plantMode();
      const availability = this.fleetAvailability();
      const kiosk = this.isKioskMode();

      if (!kiosk) {
        if (this.chartUpdateTimeout) clearTimeout(this.chartUpdateTimeout);
        this.chartUpdateTimeout = setTimeout(() => {
          this.initParetoChart(reports, isDark);
          this.initQualityChart(availability, isDark);
        }, 150);
      }
    });
  }

  togglePlantMode() {
    this.dataService.togglePlantMode();
  }

  toggleKiosk() {
    this.dataService.toggleKioskMode();
  }

  closeFailure(id: string) {
    this.dataService.closeLiveFailure(id);
  }

  selectAsset(asset: Asset) {
    window.dispatchEvent(new CustomEvent('asset-selected', { detail: asset.id }));
  }

  initQualityChart(availability: AvailabilityView, isDark: boolean) {
    if (!this.qualityCanvas) return;

    const empty = 100 - availability.percentage;
    const color =
      availability.percentage >= 90
        ? '#10b981'
        : availability.percentage >= 80
          ? '#eab308'
          : '#ef4444';
    const trackColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const existingChart = Chart.getChart(this.qualityCanvas.nativeElement);
    if (existingChart) {
      existingChart.data.datasets[0].data = [availability.percentage, empty];
      existingChart.data.datasets[0].backgroundColor = [color, trackColor];
      existingChart.update();
      return;
    }

    new Chart(this.qualityCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Disponible', 'Inactivo'],
        datasets: [
          {
            data: [availability.percentage, empty],
            backgroundColor: [color, trackColor],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '85%',
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      },
    });
  }

  initParetoChart(reports: FailureReport[], isDark: boolean) {
    if (!this.paretoCanvas) return;

    const failureCounts: { [key: string]: number } = {};
    reports.forEach((r) => {
      failureCounts[r.type] = (failureCounts[r.type] || 0) + 1;
    });

    const sortedEntries = Object.entries(failureCounts).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map((e) => e[0]);
    const data = sortedEntries.map((e) => e[1]);

    const textColor = isDark ? '#94a3b8' : '#334155';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    const existingChart = Chart.getChart(this.paretoCanvas.nativeElement);
    if (existingChart) {
      existingChart.data.labels = labels;
      existingChart.data.datasets[0].data = data;
      if (existingChart.options.scales?.y) {
        existingChart.options.scales.y.grid!.color = gridColor;
        existingChart.options.scales.y.ticks!.color = textColor;
      }
      if (existingChart.options.scales?.x) {
        existingChart.options.scales.x.ticks!.color = textColor;
      }
      existingChart.update();
      return;
    }

    new Chart(this.paretoCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Eventos',
            data: data,
            backgroundColor: '#ce1126',
            borderRadius: 4,
            barThickness: 'flex',
            maxBarThickness: 30,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: textColor, font: { size: 10 } },
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10 } },
          },
        },
      },
    });
  }
}
