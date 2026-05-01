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
    <div class="min-h-screen bg-[#0B0F19] text-slate-100 selection:bg-indigo-500/30">
      <!-- Background Decorative Elements -->
      <div class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" style="animation-delay: 2s"></div>
      </div>

      <div class="relative z-10 p-4 md:p-10 max-w-[1800px] mx-auto">
        <!-- Premium Header: Mission Control Style -->
        <header class="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div class="animate-slide-down">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 rotate-3">
                <i class="fas fa-paint-roller text-white"></i>
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Planta Cuautitlán</span>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sistema Activo</span>
                </div>
              </div>
            </div>
            <h1 class="text-5xl font-black text-white tracking-tighter font-display leading-none">
              Aesthetics <span class="text-indigo-500">&</span> <br> 
              <span class="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Refurbishment</span>
            </h1>
            <p class="text-slate-400 mt-4 max-w-xl text-sm font-medium leading-relaxed border-l-2 border-indigo-500/30 pl-6">
              Plataforma de alta precisión para la trazabilidad estética y restauración estructural de activos críticos. Control de calidad multipunto y auditoría fotográfica integrada.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 animate-slide-up">
            <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-center min-w-[200px]">
              <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estatus General</span>
              <div class="flex items-end gap-2">
                <span class="text-3xl font-black text-white">{{ averageCompliance() }}%</span>
                <span class="text-[10px] text-emerald-500 font-black mb-1.5">OPTIMIZADO</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-1 mt-3 overflow-hidden">
                <div class="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-1000" [style.width.%]="averageCompliance()"></div>
              </div>
            </div>

            <button 
              (click)="toggleNewForm()"
              class="group relative px-10 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2.5rem] font-black transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div class="relative z-10 flex items-center gap-4">
                <div class="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <i [class]="showNewForm() ? 'fas fa-arrow-left' : 'fas fa-plus'"></i>
                </div>
                <span class="text-xs uppercase tracking-widest">{{ showNewForm() ? 'VOLVER AL PANEL' : 'NUEVA RESTAURACIÓN' }}</span>
              </div>
            </button>
          </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <!-- SIDEBAR: LISTA DE PROYECTOS -->
          <div class="lg:col-span-3 space-y-6">
            <div class="relative group">
              <i class="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                placeholder="Buscar por ID o Técnico..." 
                class="w-full bg-white/5 border border-white/10 rounded-[24px] pl-14 pr-6 py-5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 text-sm font-bold backdrop-blur-md">
            </div>

            <div class="space-y-4 overflow-y-auto max-h-[700px] pr-3 custom-scroll">
              @for (item of filteredRefurbishments(); track item.id) {
                <div 
                  (click)="selectedRecord.set(item)"
                  class="group relative p-6 rounded-[2rem] border border-white/5 cursor-pointer transition-all duration-500 overflow-hidden"
                  [ngClass]="selectedRecord()?.id === item.id ? 'bg-indigo-600 shadow-2xl shadow-indigo-600/20 scale-[1.02]' : 'bg-white/5 hover:bg-white/10'">
                  
                  <div class="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-black tracking-[0.2em] uppercase" [class]="selectedRecord()?.id === item.id ? 'text-indigo-200' : 'text-indigo-400'">#{{ item.assetId }}</span>
                      </div>
                      <h4 class="text-lg font-black text-white leading-tight">Proyecto Estético</h4>
                    </div>
                    <div [class]="getStatusBadgeClass(item.status)" class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border">
                      {{ item.status }}
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-[10px] font-bold relative z-10" [class]="selectedRecord()?.id === item.id ? 'text-indigo-100' : 'text-slate-500'">
                    <span class="flex items-center gap-2">
                      <i class="fas fa-calendar-alt opacity-60"></i>
                      {{ item.startDate | date:'dd MMM, yyyy' }}
                    </span>
                    <span class="font-black">{{ item.completionPercentage }}%</span>
                  </div>

                  <div class="mt-4 w-full h-1.5 rounded-full overflow-hidden relative z-10" [class]="selectedRecord()?.id === item.id ? 'bg-indigo-800' : 'bg-slate-800'">
                    <div class="h-full rounded-full transition-all duration-1000" [class]="item.completionPercentage === 100 ? 'bg-emerald-400' : (selectedRecord()?.id === item.id ? 'bg-white' : 'bg-indigo-500')" [style.width.%]="item.completionPercentage"></div>
                  </div>
                </div>
              } @empty {
                <div class="py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                  <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-folder-open text-slate-600"></i>
                  </div>
                  <p class="text-xs font-black text-slate-500 uppercase tracking-widest">Sin registros encontrados</p>
                </div>
              }
            </div>
          </div>

          <!-- MAIN CONTENT AREA -->
          <div class="lg:col-span-9">
            @if (showNewForm()) {
              <div class="animate-fade-in">
                <div class="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 shadow-2xl relative overflow-hidden">
                  <!-- Decorative mesh -->
                  <div class="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]"></div>
                  
                  <div class="flex items-center justify-between mb-10 relative z-10">
                    <div>
                      <h2 class="text-3xl font-black text-white tracking-tight">Catálogo de Activos Flota</h2>
                      <p class="text-slate-400 text-sm mt-2 font-medium">Selecciona un activo para inicializar el protocolo de restauración avanzada.</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
                    @for (asset of assets(); track asset.id) {
                      <div 
                        (click)="selectAssetForNew(asset)"
                        class="group relative bg-[#0B0F19] rounded-[2.5rem] border border-white/5 p-2 hover:border-indigo-500/40 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-indigo-600/10">
                        
                        <div class="aspect-[16/11] rounded-[2.2rem] overflow-hidden relative">
                          <img [src]="asset.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600'" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]">
                          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                          
                          <div class="absolute top-5 right-5">
                            <span class="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-[10px] font-black text-white tracking-widest shadow-xl">#{{ asset.id }}</span>
                          </div>
                          
                          <div class="absolute bottom-6 left-6">
                            <div class="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 px-3 py-1 rounded-full">
                              <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                              <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{{ asset.status.name }}</span>
                            </div>
                          </div>
                        </div>

                        <div class="p-6">
                          <h3 class="text-xl font-black text-white mb-1 group-hover:text-indigo-400 transition-colors">{{ asset.brand }}</h3>
                          <p class="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">{{ asset.model }}</p>
                          
                          <div class="flex items-center justify-between pt-4 border-t border-white/5">
                            <span class="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Protocolo SMP</span>
                            <div class="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                              <i class="fas fa-chevron-right text-xs"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- CONFIGURATION MODAL (OVERLAY) -->
                @if (tempSelectedAsset()) {
                  <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60 animate-fade-in">
                    <div class="bg-[#0B0F19] w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[3.5rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] p-10 custom-scroll relative">
                      <div class="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <i class="fas fa-palette text-[15rem] rotate-12"></i>
                      </div>

                      <div class="flex flex-col md:flex-row justify-between items-start mb-12 relative z-10">
                        <div class="flex items-center gap-8">
                          <div class="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-white/5 shadow-2xl">
                            <img [src]="tempSelectedAsset()?.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=300'" class="w-full h-full object-cover">
                          </div>
                          <div>
                            <span class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 block">Configuración de Protocolo</span>
                            <h2 class="text-4xl font-black text-white tracking-tight">Unidad Industrial {{ tempSelectedAsset()?.id }}</h2>
                            <p class="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{{ tempSelectedAsset()?.brand }} {{ tempSelectedAsset()?.model }}</p>
                          </div>
                        </div>
                        <button (click)="tempSelectedAsset.set(null)" class="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>

                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                        <div class="space-y-8">
                          <div class="bg-white/5 rounded-[2.5rem] p-8 border border-white/5">
                            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Responsable del Proyecto</label>
                            <div class="relative">
                              <i class="fas fa-user-gear absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500"></i>
                              <input [(ngModel)]="newRecord.technician" type="text" placeholder="Nombre del Técnico" class="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold transition-all placeholder:text-slate-700">
                            </div>
                          </div>

                          <div class="space-y-4">
                            <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3 mb-2 px-4">
                              <i class="fas fa-tasks text-indigo-500"></i> Protocolo de Desarmado
                            </h3>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              @for (item of newRecord.checklist; track item.part) {
                                <div class="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                                  <span class="text-sm font-bold text-slate-300">{{ item.part }}</span>
                                  <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" [(ngModel)]="item.removed" class="sr-only peer">
                                    <div class="w-12 h-7 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                                  </label>
                                </div>
                              }
                            </div>
                          </div>
                        </div>

                        <div class="space-y-8">
                          <div class="p-8 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/20 space-y-6">
                            <h3 class="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                              <i class="fas fa-fill-drip"></i> Especificaciones de Recubrimiento
                            </h3>
                            <div class="space-y-4">
                              <div class="grid grid-cols-2 gap-4">
                                <input [(ngModel)]="newRecord.paintDetails!.color" placeholder="Color (RAL/HEX)" class="col-span-2 w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                <input [(ngModel)]="newRecord.paintDetails!.brand" placeholder="Marca de Pintura" class="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                <input [(ngModel)]="newRecord.paintDetails!.layers" type="number" placeholder="Capas" class="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3 mb-4 px-4">
                              <i class="fas fa-camera text-indigo-500"></i> Estado Inicial (Evidencia)
                            </h3>
                            <div class="grid grid-cols-3 gap-4">
                              @if (newRecord.photos) {
                                @for (img of newRecord.photos.before; track $index) {
                                  <div class="aspect-square rounded-3xl overflow-hidden border-2 border-indigo-500/30 group relative shadow-xl">
                                    <img [src]="img" class="w-full h-full object-cover">
                                    <button (click)="removePhoto('before', $index)" class="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <i class="fas fa-trash-alt text-white"></i>
                                    </button>
                                  </div>
                                }
                              }
                              @if ((newRecord.photos?.before?.length || 0) < 3) {
                                <label class="aspect-square rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-white/10 transition-all group">
                                  <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <i class="fas fa-plus text-slate-500"></i>
                                  </div>
                                  <span class="text-[8px] font-black text-slate-600 uppercase tracking-widest">Subir</span>
                                  <input type="file" (change)="onFileSelected($event, 'before')" class="hidden" accept="image/*">
                                </label>
                              }
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="mt-12 flex gap-4 relative z-10">
                        <button 
                          (click)="saveNewRecord()"
                          [disabled]="!newRecord.technician || (newRecord.photos?.before?.length === 0)"
                          class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-3xl font-black text-lg shadow-2xl shadow-indigo-600/30 transition-all disabled:opacity-20 disabled:grayscale transform active:scale-95">
                          INICIAR PROTOCOLO DE RESTAURACIÓN
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else if (selectedRecord()) {
              <div class="animate-fade-in">
                <div class="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 overflow-hidden shadow-2xl">
                  <!-- Detail Header -->
                  <div class="p-10 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 bg-gradient-to-r from-white/5 to-transparent">
                    <div class="flex items-center gap-8">
                      <div class="w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <span class="relative z-10">#{{ selectedRecord()?.assetId?.toString()?.substring(selectedRecord()?.assetId?.toString()?.length! - 2) }}</span>
                      </div>
                      <div>
                        <div class="flex items-center gap-4 mb-2">
                          <h2 class="text-4xl font-black text-white tracking-tighter">Unidad {{ selectedRecord()?.assetId }}</h2>
                          <div [class]="getStatusBadgeClass(selectedRecord()!.status)" class="px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border">
                            {{ selectedRecord()?.status }}
                          </div>
                        </div>
                        <div class="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <span class="flex items-center gap-2"><i class="fas fa-user-gear text-indigo-500"></i> {{ selectedRecord()?.technician }}</span>
                          <span class="flex items-center gap-2"><i class="fas fa-calendar-check text-indigo-500"></i> {{ selectedRecord()?.startDate | date:'dd MMM, yyyy' }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-10 bg-white/5 px-8 py-4 rounded-[2.5rem] border border-white/10">
                      <div class="text-center">
                        <span class="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 block">Progreso</span>
                        <div class="flex items-baseline gap-1">
                          <span class="text-3xl font-black text-white">{{ selectedRecord()?.completionPercentage }}</span>
                          <span class="text-xs font-black text-indigo-400">%</span>
                        </div>
                      </div>
                      <div class="w-px h-10 bg-white/10"></div>
                      <div class="w-48">
                        <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div class="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-[2s]" [style.width.%]="selectedRecord()?.completionPercentage"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="p-10 grid grid-cols-1 xl:grid-cols-12 gap-12">
                    <!-- Photo Evidence Section -->
                    <div class="xl:col-span-8 space-y-10">
                      <div>
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                          <h3 class="text-xl font-black text-white flex items-center gap-4">
                            <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-sm">
                              <i class="fas fa-camera-retro text-indigo-500"></i>
                            </div>
                            Evidencias de Auditoría
                          </h3>
                          <div class="flex bg-black/40 p-1.5 rounded-[20px] border border-white/5">
                            <button (click)="activeStage.set('before')" [ngClass]="activeStage() === 'before' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'" class="px-6 py-2.5 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all">Antes</button>
                            <button (click)="activeStage.set('process')" [ngClass]="activeStage() === 'process' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'" class="px-6 py-2.5 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all">Proceso</button>
                            <button (click)="activeStage.set('after')" [ngClass]="activeStage() === 'after' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'" class="px-6 py-2.5 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all">Después</button>
                          </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          @for (img of getCurrentPhotos(); track $index) {
                            <div class="aspect-[4/3] rounded-[2.5rem] overflow-hidden border-2 border-white/5 group relative shadow-2xl">
                              <img [src]="img" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]">
                              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <span class="text-[9px] font-black text-white uppercase tracking-widest">Captura Auditor {{ $index + 1 }}</span>
                              </div>
                            </div>
                          }
                          @if (selectedRecord()?.status !== 'Finalizado') {
                            <label class="aspect-[4/3] rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-indigo-500/50 transition-all group">
                              <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xl">
                                <i class="fas fa-cloud-upload-alt text-indigo-500 text-xl"></i>
                              </div>
                              <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">Adjuntar Evidencia</span>
                              <input type="file" (change)="onFileSelected($event, activeStage())" class="hidden" accept="image/*">
                            </label>
                          }
                        </div>
                      </div>

                      <div class="bg-white/5 rounded-[3rem] p-8 border border-white/5">
                        <h3 class="text-lg font-black text-white mb-6 flex items-center gap-3"><i class="fas fa-brush text-indigo-500"></i> Detalles Técnicos</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div class="bg-black/40 p-5 rounded-3xl border border-white/5">
                            <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Color RAL</span>
                            <p class="text-sm font-bold text-white">{{ selectedRecord()?.paintDetails?.color || 'N/A' }}</p>
                          </div>
                          <div class="bg-black/40 p-5 rounded-3xl border border-white/5">
                            <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Recubrimiento</span>
                            <p class="text-sm font-bold text-white">{{ selectedRecord()?.paintDetails?.brand || 'N/A' }}</p>
                          </div>
                          <div class="bg-black/40 p-5 rounded-3xl border border-white/5">
                            <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Capas Totales</span>
                            <p class="text-sm font-bold text-white">{{ selectedRecord()?.paintDetails?.layers || '2' }}</p>
                          </div>
                          <div class="bg-black/40 p-5 rounded-3xl border border-white/5">
                            <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Auditoría</span>
                            <p class="text-sm font-bold text-emerald-500">Aprobada</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Checklist Sidebar -->
                    <div class="xl:col-span-4 space-y-8">
                      <div class="bg-indigo-600 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                        <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <h3 class="text-2xl font-black text-white mb-8 relative z-10 flex items-center gap-4">
                          <i class="fas fa-microchip"></i>
                          Protocolo
                        </h3>
                        <div class="space-y-4 relative z-10">
                          @for (check of selectedRecord()?.checklist; track check.part) {
                            <div class="flex items-center justify-between bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10 transition-all hover:bg-white/20">
                              <div>
                                <p class="text-sm font-black text-white leading-tight">{{ check.part }}</p>
                                <div class="flex items-center gap-2 mt-1">
                                  <span class="w-1.5 h-1.5 rounded-full" [class]="check.condition === 'Bueno' ? 'bg-emerald-400' : 'bg-amber-400'"></span>
                                  <span class="text-[9px] font-black text-white/60 uppercase tracking-widest">{{ check.condition }}</span>
                                </div>
                              </div>
                              <button 
                                *ngIf="selectedRecord()?.status !== 'Finalizado' && check.removed"
                                (click)="toggleReinstall(check)"
                                [ngClass]="check.reinstalled ? 'bg-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'bg-black/20 text-white/40'"
                                class="w-10 h-10 rounded-2xl flex items-center justify-center transition-all">
                                <i class="fas fa-check text-xs"></i>
                              </button>
                            </div>
                          }
                        </div>
                      </div>

                      @if (selectedRecord()?.status !== 'Finalizado') {
                        <div class="space-y-4">
                          <button 
                            (click)="finishSelected()" 
                            [disabled]="selectedRecord()?.completionPercentage! < 90" 
                            class="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-20 disabled:grayscale">
                            COMPLETAR PROYECTO
                          </button>
                          <p class="text-[10px] text-center text-slate-500 font-black uppercase tracking-widest px-8 leading-relaxed">Requiere 90% de avance y auditoría fotográfica final para cerrar.</p>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Empty State / Mission Control Screen -->
              <div class="h-full min-h-[700px] flex flex-col items-center justify-center bg-white/5 border-2 border-dashed border-white/5 rounded-[4rem] text-center p-12 relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div class="w-40 h-40 bg-slate-800 rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 shadow-2xl group-hover:rotate-12 transition-transform duration-700">
                  <i class="fas fa-palette text-6xl text-slate-600 group-hover:text-indigo-500 transition-colors"></i>
                </div>
                <h3 class="text-4xl font-black text-white tracking-tight mb-4">Aesthetics Control Center</h3>
                <p class="text-slate-500 max-w-sm font-medium leading-relaxed">Monitoreo de proyectos de restauración estética. Selecciona un registro del historial o inicializa una nueva unidad.</p>
                <div class="mt-10 flex gap-4 opacity-40">
                  <div class="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">ISO 9001</span>
                  </div>
                  <div class="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                    <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trazabilidad</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-slide-down { animation: slide-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-fade-in { animation: fade-in 1s ease-out forwards; }
    .animate-pulse-slow { animation: pulse 8s infinite cubic-bezier(0.4, 0, 0.6, 1); }
    
    @keyframes slide-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.3; } }
    
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
    
    .font-display { font-family: 'Outfit', sans-serif; }
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
      { part: 'Asiento Principal', removed: true, condition: 'Bueno', reinstalled: false },
      { part: 'Torreta de Señalización', removed: true, condition: 'Bueno', reinstalled: false },
      { part: 'Espejos Panorámicos', removed: true, condition: 'Bueno', reinstalled: false },
      { part: 'Kit de Calcomanías Seguridad', removed: true, condition: 'Bueno', reinstalled: false },
      { part: 'Cubiertas de Motor', removed: true, condition: 'Bueno', reinstalled: false }
    ],
    paintDetails: { color: '', brand: '', layers: 2 },
    observations: '',
    qualityCheck: { glossLevel: 'Medio', adhesionTest: true, textureUniformity: true }
  };

  filteredRefurbishments = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return this.refurbishments().filter(r => 
      r.assetId.toString().includes(q) || 
      r.technician.toLowerCase().includes(q)
    );
  });

  averageCompliance = computed(() => {
    const list = this.refurbishments();
    return list.length ? Math.round(list.reduce((a, r) => a + r.completionPercentage, 0) / list.length) : 0;
  });

  toggleNewForm() { 
    this.showNewForm.update(v => !v); 
    this.selectedRecord.set(null); 
    this.tempSelectedAsset.set(null); 
  }

  selectAssetForNew(asset: Asset) { 
    this.tempSelectedAsset.set(asset); 
    this.newRecord.assetId = asset.id; 
  }

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

  getCurrentPhotos() { 
    return this.selectedRecord()?.photos[this.activeStage()] || []; 
  }

  toggleReinstall(item: any) {
    item.reinstalled = !item.reinstalled;
    if (this.selectedRecord()) {
      this.dataService.updateRefurbishment(this.selectedRecord()!.id, { 
        checklist: [...this.selectedRecord()!.checklist] 
      });
      this.calculateCompletion(this.selectedRecord()!);
    }
  }

  calculateCompletion(record: RefurbishmentRecord) {
    let p = { 
      'Programado': 10, 
      'En Proceso': 30, 
      'Pintura': 60, 
      'Secado': 80, 
      'Finalizado': 100 
    }[record.status] || 0;
    
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

  getStatusBadgeClass(s: string) {
    const base = 'bg-white/5 ';
    switch (s) {
      case 'Programado': return base + 'text-blue-400 border-blue-400/20';
      case 'En Proceso': return base + 'text-amber-400 border-amber-400/20';
      case 'Pintura': return base + 'text-indigo-400 border-indigo-400/20';
      case 'Secado': return base + 'text-cyan-400 border-cyan-400/20';
      case 'Finalizado': return base + 'text-emerald-400 border-emerald-400/20';
      default: return base + 'text-slate-400 border-slate-400/20';
    }
  }
}
