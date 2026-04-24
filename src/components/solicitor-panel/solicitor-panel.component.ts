// solicitor-panel.component.ts — App Operador (Reporte de Fallas)
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-solicitor-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="bg-slate-900 text-white rounded-2xl p-6 text-center">
        <i class="fas fa-mobile-alt text-3xl text-red-400 mb-2 block"></i>
        <h2 class="text-xl font-black">Reporte de Falla</h2>
        <p class="text-slate-400 text-sm mt-1">Planta Cuautitlán · Turno Activo</p>
      </div>

      @if (!reportSubmitted()) {
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div>
            <label class="text-xs font-bold uppercase text-slate-500 block mb-1">ID Económico del Equipo *</label>
            <input [(ngModel)]="form.economico" placeholder="Ej: CUA-35526"
              class="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
          </div>
          <div>
            <label class="text-xs font-bold uppercase text-slate-500 block mb-1">Categoría de Falla *</label>
            <select [(ngModel)]="form.categoria"
              class="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="">Seleccionar...</option>
              <option>Eléctrico</option><option>Mecánico</option><option>Hidráulico</option>
              <option>Llantas</option><option>Operador</option><option>Estructural</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold uppercase text-slate-500 block mb-1">Descripción de la Falla *</label>
            <textarea [(ngModel)]="form.descripcion" (blur)="getQuickAdvice()" rows="3" placeholder="Describe qué observas..."
              class="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"></textarea>
          </div>
          <div>
            <label class="text-xs font-bold uppercase text-slate-500 block mb-1">Tu Nombre *</label>
            <input [(ngModel)]="form.operador" placeholder="Nombre completo"
              class="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
          </div>

          @if (loadingAdvice()) {
            <div class="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
              <span class="material-symbols-outlined text-sm">sync</span>
              Analizando falla para tu seguridad...
            </div>
          }

          @if (aiAdvice()) {
            <div class="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl animate-in fade-in slide-in-from-top-2">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-amber-600 dark:text-amber-400">info</span>
                <div>
                  <p class="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">Asistente de Seguridad IA</p>
                  <p class="text-sm text-amber-900 dark:text-amber-200 leading-snug">{{ aiAdvice() }}</p>
                </div>
              </div>
            </div>
          }

          <button (click)="submitReport()"
            [disabled]="!isFormValid() || submitting()"
            class="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
            @if (submitting()) { <i class="fas fa-circle-notch fa-spin mr-2"></i>Enviando... }
            @else { <i class="fas fa-paper-plane mr-2"></i>Reportar Falla }
          </button>
        </div>
      } @else {
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-300 dark:border-emerald-700 p-8 text-center">
          <i class="fas fa-check-circle text-5xl text-emerald-500 mb-4 block"></i>
          <h3 class="text-xl font-black text-slate-800 dark:text-white">Reporte Enviado</h3>
          <p class="text-slate-500 text-sm mt-2">El equipo de Toyota ha sido notificado. ID: {{ lastReportId() }}</p>
          <button (click)="resetForm()"
            class="mt-6 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold text-sm hover:bg-slate-200 transition">
            Nuevo Reporte
          </button>
        </div>
      }
    </div>
  `
})
export class SolicitorPanelComponent {
  dataService   = inject(DataService);
  geminiService = inject(GeminiService);

  form = { economico: '', categoria: '', descripcion: '', operador: '' };
  submitting      = signal(false);
  loadingAdvice   = signal(false);
  reportSubmitted = signal(false);
  lastReportId    = signal('');
  aiAdvice        = signal('');

  isFormValid() {
    return this.form.economico && this.form.categoria && this.form.descripcion && this.form.operador;
  }

  async getQuickAdvice() {
    if (!this.form.categoria || this.form.descripcion.length < 10 || this.aiAdvice()) return;
    
    this.loadingAdvice.set(true);
    try {
      const advice = await this.geminiService.getOperatorAdvice(this.form.categoria, this.form.descripcion);
      this.aiAdvice.set(advice);
    } catch (err) {
      console.error('Advice Error:', err);
    } finally {
      this.loadingAdvice.set(false);
    }
  }

  async submitReport() {
    if (!this.isFormValid()) return;
    this.submitting.set(true);
    try {
      // Si no hay consejo previo, pedir uno final
      if (!this.aiAdvice()) {
        const advice = await this.geminiService.getOperatorAdvice(this.form.categoria, this.form.descripcion);
        this.aiAdvice.set(advice);
      }

      this.dataService.addLiveFailure({
        economico: this.form.economico,
        falla: `[${this.form.categoria}] ${this.form.descripcion}`,
        prioridad: 'Media',
        reporta: this.form.operador,
        estatus: 'Abierta'
      });
      this.lastReportId.set('F-' + Date.now());
      this.reportSubmitted.set(true);
    } finally {
      this.submitting.set(false);
    }
  }

  resetForm() {
    this.form = { economico: '', categoria: '', descripcion: '', operador: '' };
    this.aiAdvice.set('');
    this.reportSubmitted.set(false);
  }
}
