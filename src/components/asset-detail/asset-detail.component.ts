import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { DataService } from '../../services/data.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    @if (asset()) {
      <div class="bg-white dark:bg-corporate-dark rounded-[32px] overflow-hidden shadow-2xl animate-fade-in border border-slate-200 dark:border-white/5">
        <!-- Header -->
        <div class="bg-slate-900 dark:bg-black/40 text-white p-8 relative overflow-hidden">
          <div class="absolute -top-24 -right-24 w-64 h-64 bg-femsa-red/10 rounded-full blur-[80px]"></div>
          <div class="relative z-10 flex justify-between items-start">
            <div>
              <div class="flex items-center gap-3 mb-3">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-femsa-red bg-femsa-red/10 px-3 py-1 rounded-lg border border-femsa-red/20">Industrial Asset</span>
                @if (asset()!.critical) {
                  <span class="text-[10px] font-black px-3 py-1 rounded-lg bg-red-600 text-white animate-pulse">⚡ CRITICAL OPS</span>
                }
              </div>
              <h2 class="text-4xl font-black tracking-tight font-display mb-2">{{ asset()!.id }}</h2>
              <p class="text-slate-400 text-sm font-medium flex items-center gap-3">
                <span class="text-white">{{ asset()!.brand }} {{ asset()!.model }}</span>
                <span class="w-1 h-1 bg-slate-700 rounded-full"></span>
                <span>S/N: {{ asset()!.serial }}</span>
              </p>
            </div>
            <button (click)="close()" class="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center text-xl backdrop-blur-md border border-white/5">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-white/5">
          <!-- Info General -->
          <div class="p-8 space-y-8">
            <div>
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6">Especificaciones Técnicas</h3>
              <dl class="space-y-4">
                @for (item of infoItems(); track item.label) {
                  <div class="flex justify-between items-end border-b border-slate-50 dark:border-white/5 pb-2">
                    <dt class="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{{ item.label }}</dt>
                    <dd class="text-sm font-black text-slate-900 dark:text-white">{{ item.value }}</dd>
                  </div>
                }
              </dl>
            </div>

            <div class="space-y-3">
              <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4">Motor de Inteligencia</h4>
              <button (click)="runPredictiveAnalysis()"
                [disabled]="aiLoading()"
                class="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-femsa-red hover:text-white dark:hover:bg-femsa-red dark:hover:text-white disabled:opacity-60 active:scale-95 shadow-xl shadow-slate-200 dark:shadow-none">
                <i class="fas" [class.fa-brain]="!aiLoading()" [class.fa-circle-notch]="aiLoading()" [class.fa-spin]="aiLoading()"></i>
                {{ aiLoading() ? 'Analizando Historial...' : 'Predictivo IA Avanzado' }}
              </button>
              <button (click)="generateLoto()"
                [disabled]="lotoLoading()"
                class="w-full bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-red-600 hover:text-white active:scale-95">
                <i class="fas fa-lock"></i> Generar Protocolo LOTO
              </button>
            </div>

            <!-- Inspección Visual -->
            <div>
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-4">Inspección por Visión Computacional</label>
              <label class="cursor-pointer group block w-full border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[24px] p-8 text-center hover:border-femsa-red/50 hover:bg-femsa-red/5 transition-all duration-300">
                <div class="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <i class="fas fa-camera-retro text-2xl text-slate-400 group-hover:text-femsa-red"></i>
                </div>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cargar Evidencia Visual</span>
                <input type="file" accept="image/*" class="hidden" (change)="onImageSelected($event)">
              </label>
            </div>
          </div>

          <!-- Historial de Mantenimiento -->
          <div class="p-8 bg-slate-50/50 dark:bg-black/10">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6">Bitácora de Intervenciones</h3>
            @if (history().length === 0) {
              <div class="flex flex-col items-center justify-center py-20 text-slate-400 opacity-40">
                <i class="fas fa-clipboard-check text-4xl mb-4"></i>
                <p class="text-xs font-black uppercase tracking-widest">Sin registros previos</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (report of history(); track report.id) {
                  <div class="p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 group hover:border-femsa-red/30 transition-all">
                    <div class="flex justify-between items-start mb-3">
                      <span class="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded tracking-widest">{{ report.type }}</span>
                      <span class="text-[10px] font-mono text-slate-400 font-bold">{{ report.entryDate | date:'dd.MM.yy' }}</span>
                    </div>
                    <p class="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug mb-3 group-hover:text-femsa-red transition-colors">{{ report.failureDescription }}</p>
                    <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                      <span class="text-slate-400"><i class="fas fa-user-gear mr-1"></i> {{ report.technician }}</span>
                      <span class="text-emerald-500">$ {{ report.estimatedCost | number }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Insights de IA -->
          <div class="p-8">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6">Cognición y Diagnóstico</h3>
            @if (aiResult()) {
              <div class="prose prose-sm prose-slate dark:prose-invert max-w-none text-sm font-medium animate-fade-in" [innerHTML]="aiResult()"></div>
            } @else {
              <div class="flex flex-col items-center justify-center py-20 text-slate-400 opacity-30">
                <i class="fas fa-microchip text-5xl mb-6"></i>
                <p class="text-xs font-black text-center uppercase tracking-widest max-w-[160px]">Esperando ejecución de algoritmos IA</p>
              </div>
            }

            @if (imageAnalysis()) {
              <div class="mt-8 p-6 bg-slate-900 dark:bg-black rounded-[24px] text-white border-l-4 border-femsa-red animate-fade-in shadow-2xl relative overflow-hidden">
                <div class="absolute -top-12 -right-12 w-32 h-32 bg-femsa-red/20 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                  <p class="text-[10px] font-black uppercase tracking-[0.3em] text-femsa-red mb-4">Inspección Visual IA</p>
                  <div class="space-y-4">
                    <div class="flex justify-between border-b border-white/5 pb-2">
                      <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Componente</span>
                      <span class="text-xs font-black">{{ imageAnalysis()!.inspection.asset.component_affected }}</span>
                    </div>
                    <div class="flex justify-between border-b border-white/5 pb-2">
                      <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gravedad</span>
                      <span [class]="'text-xs font-black ' + getSeverityColor(imageAnalysis()!.inspection.severity.level)">
                        {{ imageAnalysis()!.inspection.severity.level }}
                      </span>
                    </div>
                    <div class="pb-2">
                      <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Causa Probable</span>
                      <p class="text-xs font-medium leading-relaxed text-slate-300">{{ imageAnalysis()!.inspection.root_cause_analysis.probable_cause }}</p>
                    </div>
                    <div class="flex items-center gap-3 pt-2">
                      <div class="px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                        <span class="text-[9px] text-slate-500 font-black uppercase mr-2">MTTR Est.</span>
                        <span class="text-xs font-black text-emerald-400">{{ imageAnalysis()!.inspection.repair_plan.estimated_mttr_hours }} hrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class AssetDetailComponent {
  @Input() assetId!: string;

  dataService   = inject(DataService);
  geminiService = inject(GeminiService);
  sanitizer     = inject(DomSanitizer);

  aiLoading   = signal(false);
  lotoLoading = signal(false);
  aiResult    = signal<SafeHtml | null>(null);
  imageAnalysis = signal<any>(null);

  asset   = computed(() => this.dataService.getAsset(this.assetId));
  history = computed(() => this.dataService.getAssetHistory(this.assetId));

  infoItems = computed(() => {
    const a = this.asset();
    if (!a) return [];
    return [
      { label: 'Asset Code',   value: a.sapCode || 'N/A' },
      { label: 'Propulsión',   value: a.fuelType },
      { label: 'Location',     value: a.location },
      { label: 'Lead Tech',    value: a.supervisor || 'N/A' },
      { label: 'Runtime',      value: (a.operatingHours?.toLocaleString() || '0') + ' hrs' },
      { label: 'Certificación', value: a.cleanlinessStatus },
      { label: 'Adquisición',  value: new Date(a.acquisitionDate).getFullYear().toString() },
    ];
  });

  close() { window.dispatchEvent(new CustomEvent('asset-closed')); }

  async runPredictiveAnalysis() {
    const a = this.asset();
    if (!a) return;
    this.aiLoading.set(true);
    try {
      const html = await this.geminiService.analyzeMaintenanceHistory(a, this.history());
      this.aiResult.set(this.sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(html)));
    } catch { /* error handled in service */ }
    finally { this.aiLoading.set(false); }
  }

  async generateLoto() {
    const a = this.asset();
    if (!a) return;
    this.lotoLoading.set(true);
    try {
      const html = await this.geminiService.generateLotoProcedure(a, a.lastFailure || 'Mantenimiento preventivo');
      this.aiResult.set(this.sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(html)));
    } catch { /* error handled in service */ }
    finally { this.lotoLoading.set(false); }
  }

  async onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      this.aiLoading.set(true);
      try {
        const result = await this.geminiService.analyzeImage(base64, file.type);
        this.imageAnalysis.set(result);
      } catch { /* error handled in service */ }
      finally { this.aiLoading.set(false); }
    };
    reader.readAsDataURL(file);
  }

  getSeverityColor(level: string): string {
    switch (level) {
      case 'CRÍTICA': return 'text-red-500';
      case 'ALTA':    return 'text-orange-500';
      case 'MEDIA':   return 'text-amber-500';
      default:        return 'text-emerald-500';
    }
  }
}
