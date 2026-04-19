// =======================================================================================
// asset-detail.component.ts — AssetGuard Corporate Edition Advanced
// Detalle completo de un activo: info, historial de fallas, análisis IA predictivo,
// generación de procedimiento LOTO y análisis de imagen multimodal.
// =======================================================================================

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
      <div class="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-slate-900 text-white p-6 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="text-xs font-bold uppercase tracking-widest text-slate-400">Activo Industrial</span>
              <span [class]="'text-xs font-bold px-2 py-0.5 rounded-full ' + (asset()!.critical ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300')">
                {{ asset()!.critical ? '⚡ CRÍTICO' : 'Normal' }}
              </span>
            </div>
            <h2 class="text-3xl font-black tracking-tight">{{ asset()!.id }}</h2>
            <p class="text-slate-400 mt-1">{{ asset()!.brand }} {{ asset()!.model }} · Serie: {{ asset()!.serial }}</p>
          </div>
          <button (click)="close()" class="text-slate-400 hover:text-white transition text-2xl">&times;</button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-700">
          <!-- Info General -->
          <div class="p-6 space-y-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400">Información General</h3>
            <dl class="space-y-3 text-sm">
              @for (item of infoItems(); track item.label) {
                <div class="flex justify-between gap-2">
                  <dt class="text-slate-500 font-medium shrink-0">{{ item.label }}</dt>
                  <dd class="font-bold text-slate-800 dark:text-white text-right">{{ item.value }}</dd>
                </div>
              }
            </dl>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400">Acciones IA</h4>
              <button (click)="runPredictiveAnalysis()"
                [disabled]="aiLoading()"
                class="w-full bg-slate-900 hover:bg-black text-white py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-60">
                <i class="fas" [class.fa-brain]="!aiLoading()" [class.fa-circle-notch]="aiLoading()" [class.fa-spin]="aiLoading()"></i>
                {{ aiLoading() ? 'Analizando...' : 'Análisis Predictivo IA' }}
              </button>
              <button (click)="generateLoto()"
                [disabled]="lotoLoading()"
                class="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-60">
                <i class="fas fa-lock"></i> Generar Procedimiento LOTO
              </button>
            </div>

            <!-- Análisis imagen -->
            <div class="pt-4 border-t border-slate-100 dark:border-slate-700">
              <label class="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Inspección Visual (IA)</label>
              <label class="cursor-pointer block w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center hover:border-red-400 transition">
                <i class="fas fa-camera text-2xl text-slate-400 mb-2 block"></i>
                <span class="text-xs text-slate-500">Seleccionar imagen del componente</span>
                <input type="file" accept="image/*" class="hidden" (change)="onImageSelected($event)">
              </label>
            </div>
          </div>

          <!-- Historial de Fallas -->
          <div class="p-6">
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Historial de Fallas</h3>
            @if (history().length === 0) {
              <div class="flex flex-col items-center justify-center py-10 text-slate-400 opacity-60">
                <i class="fas fa-check-circle text-3xl text-emerald-400 mb-3"></i>
                <p class="text-sm font-bold text-slate-600 dark:text-slate-300">Sin fallas registradas</p>
                <p class="text-xs mt-1">Este activo no tiene historial.</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (report of history(); track report.id) {
                  <div class="p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
                    <div class="flex justify-between items-start mb-1">
                      <span class="font-bold text-slate-700 dark:text-white">{{ report.type }}</span>
                      <span class="text-slate-400">{{ report.entryDate | date:'dd/MM/yy' }}</span>
                    </div>
                    <p class="text-slate-600 dark:text-slate-300">{{ report.failureDescription }}</p>
                    <p class="text-slate-400 mt-1">Técnico: {{ report.technician }}</p>
                    <p class="text-emerald-600 font-bold">${{ report.estimatedCost | number }}</p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Panel IA -->
          <div class="p-6">
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Resultado IA</h3>
            @if (aiResult()) {
              <div class="prose prose-sm prose-slate dark:prose-invert max-w-none text-sm" [innerHTML]="aiResult()"></div>
            } @else {
              <div class="flex flex-col items-center justify-center py-10 text-slate-400 opacity-60">
                <i class="fas fa-robot text-3xl mb-3"></i>
                <p class="text-sm text-center">Ejecuta una acción IA para ver resultados aquí.</p>
              </div>
            }

            @if (imageAnalysis()) {
              <div class="mt-4 p-4 bg-slate-800 text-white rounded-xl text-xs space-y-2">
                <p class="font-bold text-red-400 uppercase">Inspección Visual</p>
                <p><span class="text-slate-400">Componente:</span> {{ imageAnalysis()!.inspection.asset.component_affected }}</p>
                <p><span class="text-slate-400">Severidad:</span>
                  <span [class]="'font-bold ' + getSeverityColor(imageAnalysis()!.inspection.severity.level)">
                    {{ imageAnalysis()!.inspection.severity.level }}
                  </span>
                </p>
                <p><span class="text-slate-400">Causa raíz:</span> {{ imageAnalysis()!.inspection.root_cause_analysis.probable_cause }}</p>
                <p><span class="text-slate-400">MTTR Est.:</span> {{ imageAnalysis()!.inspection.repair_plan.estimated_mttr_hours }} hrs</p>
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
      { label: 'SAP Code',     value: a.sapCode || 'N/A' },
      { label: 'Combustible',  value: a.fuelType },
      { label: 'Ubicación',    value: a.location },
      { label: 'Supervisor',   value: a.supervisor || 'N/A' },
      { label: 'Horas de Uso', value: (a.operatingHours?.toLocaleString() || '0') + ' hrs' },
      { label: 'Inocuidad',    value: a.cleanlinessStatus },
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
    } catch { /* error manejado en service */ }
    finally { this.aiLoading.set(false); }
  }

  async generateLoto() {
    const a = this.asset();
    if (!a) return;
    this.lotoLoading.set(true);
    try {
      const html = await this.geminiService.generateLotoProcedure(a, a.lastFailure || 'Mantenimiento preventivo');
      this.aiResult.set(this.sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(html)));
    } catch { /* error manejado en service */ }
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
      } catch { /* error manejado en service */ }
      finally { this.aiLoading.set(false); }
    };
    reader.readAsDataURL(file);
  }

  getSeverityColor(level: string): string {
    switch (level) {
      case 'CRÍTICA': return 'text-red-400';
      case 'ALTA':    return 'text-orange-400';
      case 'MEDIA':   return 'text-amber-400';
      default:        return 'text-emerald-400';
    }
  }
}
