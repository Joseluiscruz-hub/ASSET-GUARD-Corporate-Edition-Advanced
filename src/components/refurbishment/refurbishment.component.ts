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
    <div class="min-h-screen bg-slate-50 p-4 md:p-8">
      <!-- Header -->
      <div class="max-w-7xl mx-auto mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Remozamiento y Estética</h1>
            <p class="text-slate-500 mt-1">Gestión de pintura, restauración y evidencias de flota.</p>
          </div>
          <button 
            (click)="showNewForm.set(true)"
            class="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
            <i class="fas fa-paint-roller"></i>
            Nuevo Registro
          </button>
        </div>
      </div>

      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sidebar: Lista de registros -->
        <div class="lg:col-span-1 space-y-4">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 class="font-bold text-slate-700 flex items-center gap-2">
                <i class="fas fa-history text-indigo-500"></i>
                Historial Reciente
              </h2>
            </div>
            <div class="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              @for (item of refurbishments(); track item.id) {
                <div 
                  (click)="selectedRecord.set(item)"
                  [class.bg-indigo-50]="selectedRecord()?.id === item.id"
                  class="p-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div class="flex justify-between items-start mb-1">
                    <span class="font-bold text-slate-900">#{{ item.assetId }}</span>
                    <span [class]="getStatusClass(item.status)" class="text-[10px] uppercase font-black px-2 py-0.5 rounded-full border">
                      {{ item.status }}
                    </span>
                  </div>
                  <div class="text-sm text-slate-500 flex items-center gap-2">
                    <i class="far fa-calendar text-slate-400"></i>
                    {{ item.startDate | date:'mediumDate' }}
                  </div>
                  <div class="mt-2 text-xs text-slate-400 italic">
                    Técnico: {{ item.technician }}
                  </div>
                </div>
              } @empty {
                <div class="p-8 text-center text-slate-400">
                  <i class="fas fa-folder-open text-3xl mb-2 block opacity-20"></i>
                  No hay registros aún
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-2">
          @if (showNewForm()) {
            <!-- Formulario de Nuevo Registro -->
            <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn">
              <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <i class="fas fa-plus-circle"></i>
                  Registrar Remozamiento
                </h2>
                <button (click)="showNewForm.set(false)" class="text-white/80 hover:text-white">
                  <i class="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <div class="p-6 space-y-6">
                <!-- Info Básica -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Unidad (Económico)</label>
                    <select [(ngModel)]="newRecord.assetId" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                      <option value="">Seleccionar unidad...</option>
                      @for (asset of assets(); track asset.id) {
                        <option [value]="asset.id">{{ asset.id }} - {{ asset.brand }} {{ asset.model }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Técnico Responsable</label>
                    <input [(ngModel)]="newRecord.technician" type="text" placeholder="Nombre del técnico" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  </div>
                </div>

                <!-- Checklist de Desarmado -->
                <div>
                  <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <i class="fas fa-tasks text-indigo-500"></i>
                    Checklist de Desarmado (Trazabilidad)
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (item of newRecord.checklist; track item.part; let i = $index) {
                      <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span class="text-sm font-medium text-slate-700">{{ item.part }}</span>
                        <div class="flex items-center gap-3">
                          <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" [(ngModel)]="item.removed" class="sr-only peer">
                            <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                          <select [(ngModel)]="item.condition" class="text-xs bg-white border border-slate-200 rounded px-1 py-1">
                            <option value="Bueno">Bueno</option>
                            <option value="Regular">Regular</option>
                            <option value="Dañado">Dañado</option>
                          </select>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Detalles de Pintura -->
                <div class="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <h3 class="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <i class="fas fa-fill-drip"></i>
                    Especificaciones de Pintura
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-[10px] font-bold text-indigo-600 uppercase mb-1">Color / Código</label>
                      <input [(ngModel)]="newRecord.paintDetails.color" type="text" placeholder="e.g. Naranja Toyota" class="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-indigo-600 uppercase mb-1">Marca / Tipo</label>
                      <input [(ngModel)]="newRecord.paintDetails.brand" type="text" placeholder="e.g. Comex Epóxica" class="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-indigo-600 uppercase mb-1">Lote (Batch)</label>
                      <input [(ngModel)]="newRecord.paintDetails.batch" type="text" placeholder="Opcional" class="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                  </div>
                </div>

                <!-- Evidencia Antes -->
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Evidencia: Antes (Foto)</label>
                  <div class="flex items-center justify-center w-full">
                    <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                      <div class="flex flex-col items-center justify-center pt-5 pb-6">
                        @if (newRecord.photoBefore) {
                          <img [src]="newRecord.photoBefore" class="h-24 rounded-lg shadow-md">
                        } @else {
                          <i class="fas fa-camera text-slate-400 text-2xl mb-2"></i>
                          <p class="text-xs text-slate-500">Haz clic para subir foto del estado inicial</p>
                        }
                      </div>
                      <input type="file" (change)="onFileSelected($event, 'before')" class="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>

                <div class="pt-4 flex gap-3">
                  <button 
                    (click)="saveNewRecord()"
                    [disabled]="!newRecord.assetId || !newRecord.technician"
                    class="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all">
                    Iniciar Remozamiento
                  </button>
                  <button (click)="showNewForm.set(false)" class="px-6 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          } @else if (selectedRecord()) {
            <!-- Detalle de Registro Seleccionado -->
            <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn">
              <div class="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-900 text-white">
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <h2 class="text-2xl font-bold tracking-tight">Unidad {{ selectedRecord()?.assetId }}</h2>
                    <span [class]="getStatusClass(selectedRecord()!.status)" class="text-xs font-black px-3 py-1 rounded-full border shadow-sm">
                      {{ selectedRecord()?.status }}
                    </span>
                  </div>
                  <p class="text-slate-400 text-sm">ID de Proceso: {{ selectedRecord()?.id }}</p>
                </div>
                <div class="text-right">
                  <div class="text-xs font-bold text-slate-500 uppercase mb-1">Iniciado el</div>
                  <div class="text-lg font-mono">{{ selectedRecord()?.startDate | date:'shortDate' }}</div>
                </div>
              </div>

              <div class="p-6 space-y-8">
                <!-- Fotos Comparativa -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <h3 class="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-red-400"></span>
                      Evidencia: Antes
                    </h3>
                    <div class="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative group">
                      @if (selectedRecord()?.photoBefore) {
                        <img [src]="selectedRecord()?.photoBefore" class="w-full h-full object-cover">
                      } @else {
                        <i class="fas fa-image text-slate-300 text-4xl"></i>
                      }
                    </div>
                  </div>
                  <div class="space-y-2">
                    <h3 class="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Evidencia: Después
                    </h3>
                    <div class="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative group">
                      @if (selectedRecord()?.photoAfter) {
                        <img [src]="selectedRecord()?.photoAfter" class="w-full h-full object-cover">
                      } @else if (selectedRecord()?.status !== 'Finalizado') {
                        <label class="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                          <i class="fas fa-camera-retro text-indigo-400 text-4xl mb-2"></i>
                          <p class="text-xs font-bold text-indigo-600">Subir foto final</p>
                          <input type="file" (change)="onFileSelected($event, 'after')" class="hidden" accept="image/*" />
                        </label>
                      } @else {
                        <i class="fas fa-image text-slate-300 text-4xl"></i>
                      }
                    </div>
                  </div>
                </div>

                <!-- Trazabilidad de Partes -->
                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-clipboard-check text-indigo-500"></i>
                    Trazabilidad de Componentes
                  </h3>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                      <thead class="text-xs text-slate-500 uppercase">
                        <tr>
                          <th class="pb-3 pl-2">Componente</th>
                          <th class="pb-3 text-center">Removido</th>
                          <th class="pb-3">Condición</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200">
                        @for (check of selectedRecord()?.checklist; track check.part) {
                          <tr class="hover:bg-white/50 transition-colors">
                            <td class="py-3 pl-2 font-semibold text-slate-700">{{ check.part }}</td>
                            <td class="py-3 text-center">
                              <i [class]="check.removed ? 'fas fa-check-circle text-emerald-500' : 'fas fa-times-circle text-slate-300'"></i>
                            </td>
                            <td class="py-3">
                              <span [class]="getConditionClass(check.condition)" class="px-2 py-0.5 rounded text-[10px] font-bold border">
                                {{ check.condition }}
                              </span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Footer Acciones -->
                @if (selectedRecord()?.status !== 'Finalizado') {
                  <div class="pt-4 border-t border-slate-100 flex gap-3">
                    <button 
                      (click)="finishSelected()"
                      [disabled]="!selectedRecord()?.photoAfter"
                      class="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all">
                      Marcar como Finalizado
                    </button>
                    <select 
                      [ngModel]="selectedRecord()?.status" 
                      (ngModelChange)="updateStatus($event)"
                      class="px-4 bg-slate-100 text-slate-700 font-bold rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="Programado">Programado</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Pintura">Pintura</option>
                      <option value="Secado">Secado</option>
                    </select>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
              <i class="fas fa-paint-brush text-6xl mb-4 opacity-20"></i>
              <p class="font-medium">Selecciona un registro para ver el detalle o crea uno nuevo</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fadeIn {
      animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class RefurbishmentComponent {
  private dataService = inject(DataService);
  
  assets = this.dataService.assets;
  refurbishments = this.dataService.refurbishments;
  
  showNewForm = signal(false);
  selectedRecord = signal<RefurbishmentRecord | null>(null);

  newRecord = {
    assetId: '',
    technician: '',
    status: 'En Proceso' as const,
    photoBefore: '',
    photoAfter: '',
    checklist: [
      { part: 'Asiento', removed: true, condition: 'Bueno' as const },
      { part: 'Torreta / Estroboscópico', removed: true, condition: 'Bueno' as const },
      { part: 'Cinturón de Seguridad', removed: false, condition: 'Bueno' as const },
      { part: 'Espejos Retrovisores', removed: true, condition: 'Bueno' as const },
      { part: 'Guardas de Protección', removed: false, condition: 'Regular' as const },
      { part: 'Calcomanías / Emblemas', removed: true, condition: 'Bueno' as const }
    ],
    paintDetails: {
      color: 'Naranja / Gris Toyota',
      brand: 'DuPont Epóxica',
      batch: ''
    },
    observations: ''
  };

  getStatusClass(status: string) {
    switch (status) {
      case 'Programado': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'En Proceso': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pintura': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Secado': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Finalizado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  getConditionClass(cond: string) {
    switch (cond) {
      case 'Bueno': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Regular': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Dañado': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  }

  onFileSelected(event: any, type: 'before' | 'after') {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.showNewForm()) {
          if (type === 'before') this.newRecord.photoBefore = e.target.result;
        } else if (this.selectedRecord()) {
          const updated = { ...this.selectedRecord()!, [type === 'before' ? 'photoBefore' : 'photoAfter']: e.target.result };
          this.selectedRecord.set(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  saveNewRecord() {
    this.dataService.addRefurbishment(this.newRecord);
    this.showNewForm.set(false);
    // Reset form
    this.newRecord.assetId = '';
    this.newRecord.photoBefore = '';
  }

  updateStatus(newStatus: string) {
    if (this.selectedRecord()) {
      this.dataService.updateRefurbishment(this.selectedRecord()!.id, { status: newStatus as any });
      this.selectedRecord.update(r => r ? { ...r, status: newStatus as any } : null);
    }
  }

  finishSelected() {
    if (this.selectedRecord() && this.selectedRecord()?.photoAfter) {
      this.dataService.finishRefurbishment(this.selectedRecord()!.id, this.selectedRecord()!.photoAfter!);
      this.selectedRecord.set(null);
    }
  }
}
