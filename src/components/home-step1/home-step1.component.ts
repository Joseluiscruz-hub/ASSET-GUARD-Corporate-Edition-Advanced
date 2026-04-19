import { Component, inject, computed, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

const FEMSA_RED = '#ce1126';

export interface ZoneSelection {
  zones: string[];
}

@Component({
  selector: 'app-home-step1',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full min-h-full bg-slate-50 flex flex-col items-center justify-start p-4 md:p-8">
      <!-- Hero Panel -->
      <div class="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <!-- Red top accent line -->
        <div class="h-1 w-full" [style.background-color]="FEMSA_RED"></div>
        <!-- Panel Body -->
        <div class="p-6 md:p-10">
          <!-- Step Badge -->
          <div class="mb-5">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200"
            >
              <span
                class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-red-700"
                >1</span>
              Paso 1 de 5
            </span>
          </div>
          <!-- Title + Subtitle -->
          <h1 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mb-2">
            Selecciona las zonas a analizar
          </h1>
          <p class="text-sm md:text-base text-slate-500 mb-6">
            Elige una o varias zonas operativas para comparar disponibilidad, fallas y cumplimiento de mantenimiento.
          </p>
          <!-- Micro-benefits -->
          <ul class="flex flex-col sm:flex-row gap-3 mb-8">
            @for (b of microBenefits; track b.label) {
              <li class="flex items-start gap-2 text-xs text-slate-500">
                <i [class]="b.icon + ' mt-0.5 shrink-0'" [style.color]="FEMSA_RED"></i>
                <span>{{ b.label }}</span>
              </li>
            }
          </ul>
          <!-- Zone Selection Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            @for (zone of zones(); track zone.name) {
              <button
                type="button"
                (click)="toggleZone(zone.name)"
                class="group relative text-left rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                [class.border-slate-200]="!isSelected(zone.name)"
                [class.bg-white]="!isSelected(zone.name)"
                [class.shadow-sm]="!isSelected(zone.name)"
                [style.border-color]="isSelected(zone.name) ? FEMSA_RED : ''"
                [style.background-color]="isSelected(zone.name) ? '#fef2f2' : ''"
                [attr.aria-pressed]="isSelected(zone.name)"
              >
                <!-- Selection checkmark -->
                @if (isSelected(zone.name)) {
                  <span
                    class="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                    [style.background-color]="FEMSA_RED"
                  >
                    <i class="fas fa-check"></i>
                  </span>
                }
                <!-- Zone icon -->
                <div class="flex items-center gap-3 mb-2">
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                    [style.background-color]="isSelected(zone.name) ? FEMSA_RED : '#f1f5f9'"
                  >
                    <i
                      [class]="'fas ' + zone.icon + ' text-base'"
                      [style.color]="isSelected(zone.name) ? 'white' : '#64748b'"
                    ></i>
                  </div>
                  <span
                    class="text-sm font-bold leading-tight"
                    [class.text-slate-800]="!isSelected(zone.name)"
                    [style.color]="isSelected(zone.name) ? FEMSA_RED : ''"
                    >{{ zone.name }}</span>
                </div>
                <!-- Zone stats -->
                <div class="flex items-center gap-3 text-xs text-slate-500 pl-12">
                  <span>
                    <span class="font-bold text-slate-700">{{ zone.assetCount }}</span>
                    {{ zone.assetCount === 1 ? 'activo' : 'activos' }}
                  </span>
                  <span class="text-slate-300">|</span>
                  <span>
                    <span
                      class="font-bold"
                      [class.text-emerald-600]="zone.availability >= 80"
                      [class.text-amber-600]="zone.availability >= 50 && zone.availability < 80"
                      [class.text-red-600]="zone.availability < 50"
                      >{{ zone.availability }}%</span>
                    disp.
                  </span>
                </div>
              </button>
            }
          </div>
          <!-- Actions -->
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              (click)="compareZones()"
              [disabled]="selectedZones().length === 0"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              [class.text-white]="selectedZones().length > 0"
              [class.shadow-md]="selectedZones().length > 0"
              [class.bg-slate-300]="selectedZones().length === 0"
              [class.text-slate-500]="selectedZones().length === 0"
              [style.background-color]="selectedZones().length > 0 ? FEMSA_RED : ''"
            >
              <i class="fas fa-chart-bar text-sm"></i>
              Comparar zonas
              @if (selectedZones().length > 0) {
                <span
                  class="bg-white/25 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  >{{ selectedZones().length }}</span>
              }
            </button>
            <button
              type="button"
              (click)="selectAll()"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-700 transition-all"
            >
              <i class="fas fa-layer-group text-xs"></i>
              {{ allSelected() ? 'Deseleccionar todas' : 'Seleccionar todas' }}
            </button>
          </div>
        </div><!-- /Panel Body -->
      </div><!-- /Hero Panel -->
      <!-- Zone count summary -->
      <p class="mt-4 text-xs text-slate-400 text-center">
        {{ zones().length }} zona{{ zones().length !== 1 ? 's' : '' }} operativa{{ zones().length !== 1 ? 's' : '' }} disponibles
      </p>
    </div>
  `,
})
export class HomeStep1Component {
  readonly FEMSA_RED = FEMSA_RED;
  private dataService = inject(DataService);

  selectedZones = signal<string[]>([]);
  compareSelected = output<ZoneSelection>();

  /** Feature highlights displayed below the subtitle to communicate the value of zone analysis. */
  readonly microBenefits = [
    { icon: 'fas fa-bolt', label: 'Disponibilidad en tiempo real por zona' },
    { icon: 'fas fa-shield-alt', label: 'Detección temprana de fallas críticas' },
    { icon: 'fas fa-chart-line', label: 'Comparativa de cumplimiento SMP' },
  ];

  readonly zones = computed(() => {
    const assets = this.dataService.assets();
    const zoneMap = new Map<string, { total: number; operative: number }>();

    for (const asset of assets) {
      const loc = asset.location;
      const entry = zoneMap.get(loc) ?? { total: 0, operative: 0 };
      entry.total++;
      if (asset.status.name === 'Operativo') entry.operative++;
      zoneMap.set(loc, entry);
    }

    const iconMap: Record<string, string> = {
      'Cuarto de Máquinas': 'fa-cogs',
      'Nave Industrial B': 'fa-industry',
      'Línea de Estampado': 'fa-stamp',
      'Empaque Final': 'fa-box',
      'Planta Cuautitlán': 'fa-warehouse',
    };

    return Array.from(zoneMap.entries()).map(([name, stats]) => ({
      name,
      assetCount: stats.total,
      availability: stats.total > 0 ? Math.round((stats.operative / stats.total) * 100) : 0,
      icon: iconMap[name] ?? 'fa-map-marker-alt',
    }));
  });

  readonly allSelected = computed(
    () => this.zones().length > 0 && this.selectedZones().length === this.zones().length
  );

  isSelected(zoneName: string): boolean {
    return this.selectedZones().includes(zoneName);
  }

  toggleZone(zoneName: string): void {
    this.selectedZones.update(current =>
      current.includes(zoneName)
        ? current.filter(z => z !== zoneName)
        : [...current, zoneName]
    );
  }

  selectAll(): void {
    if (this.allSelected()) {
      this.selectedZones.set([]);
    } else {
      this.selectedZones.set(this.zones().map(z => z.name));
    }
  }

  compareZones(): void {
    if (this.selectedZones().length === 0) return;
    this.compareSelected.emit({ zones: this.selectedZones() });
  }
}
