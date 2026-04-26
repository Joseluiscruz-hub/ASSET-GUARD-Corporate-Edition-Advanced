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
    <div class="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col pb-20">
      
      <!-- Mobile Header -->
      <div class="bg-[#ce1126] text-white p-6 shadow-lg relative z-20">
        <h2 class="text-2xl font-black uppercase tracking-widest text-center">Reporte Rápido</h2>
        <p class="text-xs text-center text-red-200 opacity-80 mt-1 font-medium">
          {{ step() === 3 ? 'Reporte Enviado Exitosamente' : 'Selecciona el equipo para reportar' }}
        </p>
      </div>

      <!-- Step 1: Select Asset -->
      @if (step() === 1) {
        <div class="flex-1 p-4 overflow-y-auto custom-scroll">
          <div class="grid grid-cols-2 gap-4">
            @for (asset of assets(); track asset.id) {
              <button (click)="selectAsset(asset.id)" 
                      class="p-4 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-red-500 focus:border-red-500 hover:shadow-md transition-all flex flex-col items-center justify-center h-32 relative overflow-hidden group">
                
                <!-- Status Dot -->
                <span class="absolute top-3 right-3 w-3 h-3 rounded-full shadow-inner" 
                      [class.bg-green-500]="asset.status.name === 'Operativo'"
                      [class.bg-red-500]="asset.status.name === 'Taller'"></span>
                
                <span class="text-2xl font-black text-gray-800 group-hover:scale-110 transition-transform">{{ asset.id }}</span>
                <span class="text-xs text-gray-500 mt-1 font-mono font-bold">{{ asset.model }}</span>
                
                @if (asset.status.name !== 'Operativo') {
                  <div class="absolute inset-0 bg-gray-100/90 flex items-center justify-center backdrop-blur-[2px]">
                    <span class="text-[10px] font-black text-red-600 rotate-12 border-2 border-red-600 px-3 py-1 rounded bg-red-50">EN TALLER</span>
                  </div>
                }
              </button>
            }
          </div>
        </div>
      }

      <!-- Step 2: Select Issue Type & Submit -->
      @if (step() === 2) {
        <div class="flex-1 p-6 flex flex-col animate-slide-up bg-white rounded-t-3xl shadow-negative -mt-4 z-10">
          
          <div class="flex justify-between items-center mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
             <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wide">Unidad: <span class="text-[#ce1126] text-xl ml-2">{{ selectedId() }}</span></h3>
             <button (click)="step.set(1)" class="text-gray-400 font-bold text-xs hover:text-gray-600 uppercase transition-colors">Cancelar</button>
          </div>

          <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">¿Qué está fallando?</p>
          
          <div class="grid grid-cols-2 gap-3 mb-6">
            @for (cat of categories; track cat.name) {
              <button (click)="category.set(cat.name); getQuickAdvice()"
                      [class.bg-[#ce1126]]="category() === cat.name"
                      [class.text-white]="category() === cat.name"
                      [class.shadow-md]="category() === cat.name"
                      [class.bg-gray-50]="category() !== cat.name"
                      [class.text-gray-600]="category() !== cat.name"
                      [class.border-gray-200]="category() !== cat.name"
                      class="p-4 rounded-2xl border font-bold text-sm flex flex-col items-center gap-3 transition-all hover:-translate-y-1">
                <i [class]="'fas ' + cat.icon + ' text-2xl'"></i>
                {{ cat.name }}
              </button>
            }
          </div>

          <div class="mb-4">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Nota de Voz / Texto</label>
            <textarea [(ngModel)]="notes" 
                      (blur)="getQuickAdvice()"
                      rows="3" 
                      class="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#ce1126] transition-all resize-none font-medium text-gray-700" 
                      placeholder="Describe el problema brevemente..."></textarea>
          </div>

          @if (loadingAdvice()) {
            <div class="flex items-center gap-3 text-xs text-slate-500 font-bold animate-pulse mb-4 bg-slate-50 p-3 rounded-xl">
              <i class="fas fa-sync fa-spin text-[#ce1126]"></i>
              Analizando falla para tu seguridad...
            </div>
          }

          @if (aiAdvice()) {
            <div class="p-4 mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-2 shadow-sm">
              <div class="flex items-start gap-3">
                <i class="fas fa-robot text-amber-500 text-xl mt-1"></i>
                <div>
                  <p class="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1">Asistente de Seguridad IA</p>
                  <p class="text-sm text-amber-900 font-medium leading-relaxed">{{ aiAdvice() }}</p>
                </div>
              </div>
            </div>
          }

          <div class="mt-auto">
             <button (click)="submitReport()" 
                     [disabled]="!category() || submitting()"
                     class="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                @if (submitting()) {
                  <i class="fas fa-circle-notch fa-spin"></i> ENVIANDO...
                } @else {
                  <i class="fas fa-paper-plane"></i> ENVIAR REPORTE
                }
             </button>
          </div>

        </div>
      }

      <!-- Step 3: Success Screen -->
      @if (step() === 3) {
        <div class="flex-1 p-8 flex flex-col items-center justify-center animate-slide-up bg-white rounded-t-3xl shadow-negative -mt-4 z-10 text-center">
          <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <i class="fas fa-check text-5xl text-green-500"></i>
          </div>
          <h3 class="text-3xl font-black text-slate-800 mb-2">¡Reporte Enviado!</h3>
          <p class="text-slate-500 text-base font-medium">El equipo de mantenimiento Toyota ha sido notificado y está en camino.</p>
          
          <div class="bg-gray-50 border border-gray-200 px-6 py-4 rounded-2xl mt-8 shadow-inner w-full">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">ID de Seguimiento</p>
            <p class="font-mono text-gray-800 font-black text-xl">{{ lastReportId() }}</p>
          </div>
          
          <button (click)="resetForm()"
            class="mt-10 px-8 py-4 w-full border-2 border-slate-200 text-slate-600 rounded-2xl font-bold uppercase tracking-wider text-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
            Hacer Nuevo Reporte
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .shadow-negative { box-shadow: 0 -10px 30px -10px rgba(0,0,0,0.1); }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(20%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class SolicitorPanelComponent {
  dataService = inject(DataService);
  geminiService = inject(GeminiService);
  
  assets = this.dataService.assets;
  step = signal(1);
  selectedId = signal<string>('');
  category = signal<string>('');
  notes = '';
  
  submitting      = signal(false);
  loadingAdvice   = signal(false);
  lastReportId    = signal('');
  aiAdvice        = signal('');

  categories = [
    { name: 'Llantas', icon: 'fa-truck-monster' },
    { name: 'Frenos', icon: 'fa-ban' },
    { name: 'Motor', icon: 'fa-cogs' },
    { name: 'Hidráulico', icon: 'fa-oil-can' },
    { name: 'Eléctrico', icon: 'fa-bolt' },
    { name: 'Daño Físico', icon: 'fa-car-crash' }
  ];

  selectAsset(id: string) {
    const asset = this.dataService.getAsset(id);
    if (asset?.status.name === 'Taller') {
      alert('Esta unidad ya está reportada en taller.');
      return;
    }
    this.selectedId.set(id);
    this.step.set(2);
  }

  async getQuickAdvice() {
    if (!this.category() || this.notes.length < 5 || this.aiAdvice()) return;
    
    this.loadingAdvice.set(true);
    try {
      const advice = await this.geminiService.getOperatorAdvice(this.category(), this.notes);
      this.aiAdvice.set(advice);
    } catch (err) {
      console.error('Advice Error:', err);
    } finally {
      this.loadingAdvice.set(false);
    }
  }

  async submitReport() {
    if (!this.category()) return;
    
    this.submitting.set(true);
    
    try {
      if (!this.aiAdvice() && this.notes.length >= 5) {
        const advice = await this.geminiService.getOperatorAdvice(this.category(), this.notes);
        this.aiAdvice.set(advice);
      }

      const description = '[' + this.category() + '] ' + (this.notes || 'Sin detalles adicionales.');
      
      this.dataService.addLiveFailure({
        economico: this.selectedId(),
        falla: description,
        prioridad: this.category() === 'Frenos' ? 'Alta' : 'Media',
        reporta: 'Operador Móvil',
        estatus: 'Abierta'
      });

      this.lastReportId.set('F-' + Date.now());
      this.step.set(3);
    } finally {
      this.submitting.set(false);
    }
  }

  resetForm() {
    this.step.set(1);
    this.category.set('');
    this.notes = '';
    this.selectedId.set('');
    this.aiAdvice.set('');
  }
}
