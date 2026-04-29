import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Asset, RefurbishmentRecord } from '../../types';

@Component({
  selector: 'app-refurbishment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 p-4 md:p-8 text-slate-100">
      <!-- Premium Header -->
      <div class="max-w-7xl mx-auto mb-10 relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 shadow-2xl">
        <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
        <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-xs font-bold tracking-widest uppercase">Módulo Estético</span>
              <span class="text-slate-500">|</span>
              <span class="text-slate-400 text-xs uppercase tracking-wider font-semibold">Trazabilidad Total</span>
            </div>
            <h1 class="text-4xl md:text-5xl font-black text-white tracking-tight">Refurbishment <span class="text-indigo-400">&</span> Aesthetics</h1>
            <p class="text-slate-400 mt-3 max-w-xl text-lg leading-relaxed">Gestión avanzada de restauración de flota con evidencias multipunto y control de calidad industrial.</p>
          </div>
          <button 
            (click)="toggleNewForm()"
            class="group relative flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black shadow-xl hover:bg-indigo-400 hover:text-white transition-all active:scale-95 overflow-hidden">
            <span class="relative z-10 flex items-center gap-2">
              <i class="fas fa-magic"></i>
              {{ showNewForm() ? 'Volver al Historial' : 'Nueva Restauración' }}
            </span>
          </button>
        </div>
      </div>

      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- SIDEBAR / HISTORIAL -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-lg">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xs font-black text-slate-500 uppercase tracking-widest">Cumplimiento</h3>
              <i class="fas fa-chart-line text-emerald-400"></i>
            </div>
            <div class="flex items-end gap-3 mb-2">
              <span class="text-4xl font-black text-white">{{ averageCompliance() }}%</span>
              <span class="text-xs text-slate-500 mb-2">promedio flota</span>
            </div>
            <div class="w-full bg-slate-700 rounded-full h-1.5">
              <div class="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full" [style.width.%]="averageCompliance()"></div>
            </div>
          </div>

          <div class="relative group">
            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"></i>
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              placeholder="Buscar unidad..." 
              class="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 text-sm">
          </div>

          <div class="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            @for (item of filteredRefurbishments(); track item.id) {
              <div 
                (click)="selectedRecord.set(item)"
                class="p-4 rounded-2xl border border-slate-700/50 cursor-pointer hover:border-indigo-500/50 transition-all group"
                [ngClass]="selectedRecord()?.id === item.id ? 'bg-slate-800 ring-2 ring-indigo-500' : 'bg-slate-800/40'">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <span class="text-xs font-bold text-indigo-400 block mb-1">#{{ item.assetId }}</span>
                    <h4 class="font-black text-white group-hover:text-indigo-300 transition-colors">Remozado Estético</h4>
                  </div>
                  <div [class]="getStatusBg(item.status)" class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                    {{ item.status }}
                  </div>
                </div>
                <div class="flex items-center justify-between text-xs text-slate-500">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-spinner animate-spin text-[10px]" *ngIf="item.status !== 'Finalizado'"></i>
                    <span>{{ item.completionPercentage }}% Completado</span>
                  </div>
                  <span>{{ item.startDate | date:'dd/MM' }}</span>
                </div>
                <div class="mt-3 w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
                  <div class="h-full transition-all duration-1000" [ngClass]="item.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'" [style.width.%]="item.completionPercentage"></div>
                </div>
              </div>
            } @empty {
              <div class="py-12 text-center text-slate-600">
                <i class="fas fa-ghost text-4xl mb-3 opacity-20"></i>
                <p class="text-sm italic">No se encontraron registros</p>
              </div>
            }
          </div>
        </div>

        <!-- MAIN CONTENT AREA -->
        <div class="lg:col-span-3">
          @if (showNewForm()) {
            <div class="bg-slate-800/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-700/50 p-8 shadow-2xl animate-slideUp">
              <div class="flex items-center justify-between mb-8">
                <div>
                  <h2 class="text-3xl font-black text-white">Catálogo de Activos</h2>
                  <p class="text-slate-400">Selecciona la unidad para iniciar el protocolo de estética.</p>
                </div>
                <button (click)="showNewForm.set(false)" class="w-12 h-12 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 transition-all">
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (asset of assets(); track asset.id) {
                  <div 
                    (click)="selectAssetForNew(asset)"
                    class="group relative bg-slate-900/60 rounded-3xl border border-slate-800 p-1 hover:border-indigo-500/50 transition-all cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10">
                    <div class="aspect-[16/10] bg-slate-800 rounded-[1.4rem] overflow-hidden relative">
                      <img [src]="asset.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400'" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                      <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                      <div class="absolute bottom-4 left-4">
                        <span class="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-widest">{{ asset.id }}</span>
                      </div>
                    </div>
                    <div class="p-4">
                      <h3 class="text-lg font-black text-white mb-1">{{ asset.brand }}</h3>
                      <p class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">{{ asset.model }}</p>
                      <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" [ngClass]="asset.status.name === 'Operativo' ? 'bg-emerald-500' : 'bg-red-500'"></span>
                        <span class="text-[10px] font-black text-slate-400 uppercase">{{ asset.status.name }}</span>
                      </div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600/20 backdrop-blur-[2px] rounded-3xl pointer-events-none">
                      <div class="bg-white text-slate-900 font-black px-6 py-2 rounded-xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">SELECCIONAR</div>
                    </div>
                  </div>
                }
              </div>
            </div>

            @if (tempSelectedAsset()) {
              <div class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-md bg-slate-900/80 animate-fadeIn">
                <div class="bg-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] border border-slate-700 shadow-2xl p-8 custom-scrollbar">
                  <div class="flex justify-between items-start mb-8">
                    <div class="flex items-center gap-6">
                      <div class="w-24 h-24 rounded-2xl overflow-hidden border-4 border-slate-700">
                        <img [src]="tempSelectedAsset()?.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=200'" class="w-full h-full object-cover">
                      </div>
                      <div>
                        <h2 class="text-3xl font-black text-white">Configurar Protocolo</h2>
                        <p class="text-indigo-400 font-bold uppercase tracking-widest text-xs">Unidad: {{ tempSelectedAsset()?.id }}</p>
                      </div>
                    </div>
                    <button (click)="tempSelectedAsset.set(null)" class="text-slate-500 hover:text-white transition-colors"><i class="fas fa-times text-2xl"></i></button>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-6">
                      <div>
                        <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Técnico Responsable</label>
                        <input [(ngModel)]="newRecord.technician" type="text" class="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold transition-all">
                      </div>
                      <div>
                        <h3 class="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><i class="fas fa-tools text-indigo-400"></i> Checklist de Desarmado</h3>
                        <div class="space-y-3">
                          @for (item of newRecord.checklist; track item.part) {
                            <div class="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700/30">
                              <span class="text-sm font-bold text-slate-200">{{ item.part }}</span>
                              <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" [(ngModel)]="item.removed" class="sr-only peer">
                                <div class="w-10 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 shadow-inner"></div>
                              </label>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                    <div class="space-y-6">
                      <div class="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                        <h3 class="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><i class="fas fa-brush"></i> Detalles de Pintura</h3>
                        <div class="grid grid-cols-2 gap-4">
                          <div class="col-span-2">
                            <input [(ngModel)]="newRecord.paintDetails!.color" placeholder="Código de Color" class="w-full bg-slate-900/80 border border-indigo-500/20 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                          </div>
                          <input [(ngModel)]="newRecord.paintDetails!.brand" placeholder="Marca" class="bg-slate-900/80 border border-indigo-500/20 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                          <input [(ngModel)]="newRecord.paintDetails!.layers" type="number" placeholder="Capas" class="bg-slate-900/80 border border-indigo-500/20 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                        </div>
                      </div>
                      <div>
                        <h3 class="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Evidencia Inicial</h3>
                        <div class="grid grid-cols-2 gap-3">
                          @if (newRecord.photos) {
                            @for (img of newRecord.photos.before; track $index) {
                              <div class="aspect-square rounded-2xl overflow-hidden border-2 border-indigo-500/30 group relative">
                                <img [src]="img" class="w-full h-full object-cover">
                                <button (click)="removePhoto('before', $index)" class="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"><i class="fas fa-times"></i></button>
                              </div>
                            }
                          }
                          <label class="aspect-square rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800 transition-all">
                            <i class="fas fa-plus text-slate-600 text-xl mb-1"></i>
                            <span class="text-[10px] font-black text-slate-500 uppercase">Añadir Foto</span>
                            <input type="file" (change)="onFileSelected($event, 'before')" class="hidden" accept="image/*">
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-10 flex gap-4">
                    <button 
                      (click)="saveNewRecord()"
                      [disabled]="!newRecord.technician || (newRecord.photos?.before?.length === 0)"
                      class="flex-1 bg-white text-slate-900 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-500/20 hover:bg-indigo-400 hover:text-white transition-all disabled:opacity-30 disabled:grayscale">INICIAR PROYECTO</button>
                    <button (click)="tempSelectedAsset.set(null)" class="px-8 bg-slate-700 text-white font-black rounded-2xl hover:bg-slate-600 transition-all uppercase tracking-widest text-sm">Volver</button>
                  </div>
                </div>
              </div>
            }
          } @else if (selectedRecord()) {
            <div class="space-y-6 animate-fadeIn">
              <div class="bg-slate-800/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-700/50 overflow-hidden shadow-2xl">
                <div class="p-8 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div class="flex items-center gap-6">
                    <div class="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-indigo-500/40">#{{ selectedRecord()?.assetId?.toString()?.substring(0, 2) }}</div>
                    <div>
                      <div class="flex items-center gap-3 mb-1">
                        <h2 class="text-4xl font-black text-white tracking-tighter">Unidad {{ selectedRecord()?.assetId }}</h2>
                        <span [class]="getStatusBg(selectedRecord()!.status)" class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-current opacity-80">{{ selectedRecord()?.status }}</span>
                      </div>
                      <p class="text-slate-400 font-bold tracking-widest text-xs uppercase flex items-center gap-2"><i class="fas fa-user-gear text-indigo-400"></i> {{ selectedRecord()?.technician }} • {{ selectedRecord()?.startDate | date:'fullDate' }}</p>
                    </div>
                  </div>
                  <div class="text-center">
                    <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block">Avance</span>
                    <div class="relative w-20 h-20">
                      <svg class="w-full h-full" viewBox="0 0 36 36">
                        <path class="text-slate-700" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="text-indigo-500" stroke-width="3" stroke-linecap="round" stroke="currentColor" fill="none" [attr.stroke-dasharray]="selectedRecord()?.completionPercentage + ', 100'" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center"><span class="text-sm font-black text-white">{{ selectedRecord()?.completionPercentage }}%</span></div>
                    </div>
                  </div>
                </div>
                <div class="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div class="md:col-span-2 space-y-8">
                    <div>
                      <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-black text-white flex items-center gap-3"><i class="fas fa-images text-indigo-400"></i> Evidencias</h3>
                        <div class="flex gap-2">
                          <button (click)="activeStage.set('before')" [ngClass]="activeStage() === 'before' ? 'bg-indigo-600' : 'bg-slate-700'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Antes</button>
                          <button (click)="activeStage.set('process')" [ngClass]="activeStage() === 'process' ? 'bg-indigo-600' : 'bg-slate-700'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Proceso</button>
                          <button (click)="activeStage.set('after')" [ngClass]="activeStage() === 'after' ? 'bg-indigo-600' : 'bg-slate-700'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Después</button>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        @for (img of getCurrentPhotos(); track $index) {
                          <div class="aspect-video rounded-3xl overflow-hidden border-2 border-slate-700 group relative">
                            <img [src]="img" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                          </div>
                        }
                        @if (selectedRecord()?.status !== 'Finalizado') {
                          <label class="aspect-video rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-all">
                            <i class="fas fa-camera-retro text-slate-500 text-3xl mb-2"></i>
                            <input type="file" (change)="onFileSelected($event, activeStage())" class="hidden" accept="image/*">
                          </label>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="space-y-8">
                    <div class="bg-indigo-600 rounded-[2.5rem] p-8 text-white">
                      <h3 class="text-xl font-black mb-6">Trazabilidad</h3>
                      <div class="space-y-4">
                        @for (check of selectedRecord()?.checklist; track check.part) {
                          <div class="flex items-center justify-between">
                            <div>
                              <p class="text-sm font-black">{{ check.part }}</p>
                              <span class="text-[10px] font-bold text-white/60 uppercase">{{ check.condition }}</span>
                            </div>
                            <button 
                              *ngIf="selectedRecord()?.status !== 'Finalizado' && check.removed"
                              (click)="toggleReinstall(check)"
                              [ngClass]="check.reinstalled ? 'bg-emerald-400' : 'bg-white/20'"
                              class="w-8 h-8 rounded-lg flex items-center justify-center transition-all">
                              <i class="fas fa-undo-alt text-[10px]"></i>
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                    @if (selectedRecord()?.status !== 'Finalizado') {
                      <div class="space-y-4">
                        <button (click)="finishSelected()" [disabled]="selectedRecord()?.completionPercentage! < 90" class="w-full bg-emerald-500 text-slate-900 py-6 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-emerald-400 transition-all disabled:opacity-20">FINALIZAR</button>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="h-full min-h-[600px] flex flex-col items-center justify-center bg-slate-800/20 border-4 border-dashed border-slate-800 rounded-[4rem] text-slate-700 animate-fadeIn">
              <i class="fas fa-palette text-9xl opacity-5 mb-10"></i>
              <h3 class="text-3xl font-black text-slate-400 mb-2">Centro de Estética Industrial</h3>
              <p class="text-slate-600">Selecciona un registro para comenzar.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
    .animate-slideUp { animation: slideUp 0.8s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
  `]
})
export class RefurbishmentComponent {
  private dataService = inject(DataService);
  assets = this.dataService.assets;
  refurbishments = this.dataService.refurbishments;
  showNewForm = signal(false);
  selectedRecord = signal<RefurbishmentRecord | null>(null);
  tempSelectedAsset = signal<Asset | null>(null);
  searchQuery = '';
  activeStage = signal<'before' | 'process' | 'after'>('before');

  newRecord: Partial<RefurbishmentRecord> = {
    technician: '', status: 'En Proceso', completionPercentage: 10,
    photos: { before: [], process: [], after: [] },
    checklist: [
      { part: 'Asiento', removed: true, condition: 'Bueno', reinstalled: false },
      { part: 'Torreta', removed: true, condition: 'Bueno', reinstalled: false },
      { part: 'Espejos', removed: true, condition: 'Bueno', reinstalled: false },
      { part: 'Calcomanías', removed: true, condition: 'Bueno', reinstalled: false }
    ],
    paintDetails: { color: '', brand: '', layers: 2 },
    observations: '',
    qualityCheck: { glossLevel: 'Medio', adhesionTest: true, textureUniformity: true }
  };

  filteredRefurbishments = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return this.refurbishments().filter(r => r.assetId.toString().includes(q) || r.technician.toLowerCase().includes(q));
  });

  averageCompliance = computed(() => {
    const list = this.refurbishments();
    return list.length ? Math.round(list.reduce((a, r) => a + r.completionPercentage, 0) / list.length) : 0;
  });

  toggleNewForm() { this.showNewForm.update(v => !v); this.selectedRecord.set(null); this.tempSelectedAsset.set(null); }
  selectAssetForNew(asset: Asset) { this.tempSelectedAsset.set(asset); this.newRecord.assetId = asset.id; }

  onFileSelected(event: any, stage: 'before' | 'process' | 'after') {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;
        if (this.tempSelectedAsset()) {
          this.newRecord.photos![stage].push(base64);
        } else if (this.selectedRecord()) {
          const updated = { ...this.selectedRecord()!.photos };
          updated[stage] = [...updated[stage], base64];
          this.dataService.updateRefurbishment(this.selectedRecord()!.id, { photos: updated });
          this.selectedRecord.update(r => r ? { ...r, photos: updated } : null);
          this.calculateCompletion(this.selectedRecord()!);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(stage: 'before' | 'process' | 'after', index: number) { 
    if (this.newRecord.photos && this.newRecord.photos[stage]) {
      this.newRecord.photos[stage].splice(index, 1); 
    }
  }
  getCurrentPhotos() { return this.selectedRecord()?.photos[this.activeStage()] || []; }

  toggleReinstall(item: any) {
    item.reinstalled = !item.reinstalled;
    if (this.selectedRecord()) {
      this.dataService.updateRefurbishment(this.selectedRecord()!.id, { checklist: [...this.selectedRecord()!.checklist] });
      this.calculateCompletion(this.selectedRecord()!);
    }
  }

  calculateCompletion(record: RefurbishmentRecord) {
    let p = { 'Programado': 10, 'En Proceso': 30, 'Pintura': 60, 'Secado': 80, 'Finalizado': 100 }[record.status] || 0;
    const items = record.checklist.filter(c => c.removed);
    if (items.length) p += (items.filter(c => c.reinstalled).length / items.length) * 20;
    if (record.photos.before.length) p += 5;
    if (record.photos.after.length) p += 5;
    const final = Math.min(100, Math.round(p));
    if (final !== record.completionPercentage) {
      this.dataService.updateRefurbishment(record.id, { completionPercentage: final });
      this.selectedRecord.update(r => r ? { ...r, completionPercentage: final } : null);
    }
  }

  saveNewRecord() {
    this.dataService.addRefurbishment(this.newRecord as RefurbishmentRecord);
    this.showNewForm.set(false);
    this.tempSelectedAsset.set(null);
    this.newRecord.technician = '';
    this.newRecord.photos = { before: [], process: [], after: [] };
  }

  finishSelected() {
    if (this.selectedRecord()) {
      this.dataService.finishRefurbishment(this.selectedRecord()!.id, this.selectedRecord()!.photos.after[0] || '');
      this.selectedRecord.set(null);
    }
  }

  getStatusBg(s: string) {
    return {
      'Programado': 'bg-blue-500/20 text-blue-400',
      'En Proceso': 'bg-amber-500/20 text-amber-400',
      'Pintura': 'bg-indigo-500/20 text-indigo-400',
      'Secado': 'bg-cyan-500/20 text-cyan-400',
      'Finalizado': 'bg-emerald-500/20 text-emerald-400'
    }[s] || 'bg-slate-500/20 text-slate-400';
  }
}
