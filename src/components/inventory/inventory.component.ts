import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { EstadoRefaccion } from '../../types';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 animate-fade-in pb-20">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Logística de Suministros</span>
          </div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display">Inventario Crítico</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Control de refacciones para mantenimiento preventivo y correctivo</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl transition-all hover:bg-femsa-red hover:text-white dark:hover:bg-femsa-red dark:hover:text-white active:scale-95 text-xs font-black uppercase tracking-widest">
            <i class="fas fa-plus"></i>
            Registrar Refacción
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-white/5 p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
          <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total de SKUs</p>
          <p class="text-3xl font-black text-slate-900 dark:text-white font-display">{{ inventory().length }}</p>
        </div>
        <div class="bg-white dark:bg-white/5 p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
          <p class="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Stock Crítico</p>
          <div class="flex items-center gap-3">
            <p class="text-3xl font-black text-slate-900 dark:text-white font-display">{{ lowStockCount() }}</p>
            <span class="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-lg">Requiere Acción</span>
          </div>
        </div>
        <div class="bg-white dark:bg-white/5 p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
          <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Órdenes de Compra</p>
          <p class="text-3xl font-black text-slate-900 dark:text-white font-display">{{ pendingOrdersCount() }}</p>
        </div>
        <div class="bg-white dark:bg-white/5 p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
          <p class="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Valor Estimado</p>
          <p class="text-3xl font-black text-slate-900 dark:text-white font-display">$24,500 <span class="text-xs font-bold text-slate-400">USD</span></p>
        </div>
      </div>

      <!-- Controls -->
      <div class="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/10 dark:shadow-none flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            [(ngModel)]="searchTerm"
            placeholder="Buscar por SKU, descripción o categoría..." 
            class="w-full pl-12 pr-6 py-4 bg-slate-100 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-femsa-red rounded-2xl transition-all outline-none text-sm font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
          >
        </div>
        <div class="flex gap-3">
          <select class="bg-slate-100 dark:bg-white/5 border-transparent focus:ring-2 focus:ring-femsa-red rounded-2xl px-6 py-4 outline-none text-sm font-bold text-slate-700 dark:text-white cursor-pointer">
            <option>Todas las categorías</option>
            <option>Frenos</option>
            <option>Hidráulico</option>
            <option>Llantas</option>
            <option>Filtros</option>
          </select>
          <button class="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:text-femsa-red transition-colors">
            <i class="fas fa-filter"></i>
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-white/5 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              <th class="px-8 py-6">Referencia / SKU</th>
              <th class="px-8 py-6">Categoría</th>
              <th class="px-8 py-6">Existencias</th>
              <th class="px-8 py-6">Parámetros (Min/Max)</th>
              <th class="px-8 py-6">Estado Logístico</th>
              <th class="px-8 py-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5 font-bold">
            <tr *ngFor="let item of filteredInventory()" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
              <td class="px-8 py-6">
                <div class="text-sm font-black text-slate-900 dark:text-white group-hover:text-femsa-red transition-colors">{{ item.sku }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5 font-medium">{{ item.nombre }}</div>
              </td>
              <td class="px-8 py-6">
                <span class="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5">
                  {{ item.categoria || 'Repuesto' }}
                </span>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center gap-2">
                  <span class="text-lg font-black" [class.text-amber-500]="item.cantidad <= item.min" [class.text-slate-900]="item.cantidad > item.min" [class.dark:text-white]="item.cantidad > item.min">
                    {{ item.cantidad }}
                  </span>
                  @if (item.cantidad <= item.min) {
                    <i class="fas fa-arrow-trend-down text-amber-500 text-xs"></i>
                  }
                </div>
              </td>
              <td class="px-8 py-6 text-slate-500 dark:text-slate-400 font-mono text-xs">
                <span class="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">{{ item.min }}</span>
                <span class="mx-2">/</span>
                <span class="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">{{ item.max }}</span>
              </td>
              <td class="px-8 py-6">
                <span [class]="getStatusClass(item.estado)" class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border">
                  {{ item.estado }}
                </span>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-femsa-red hover:bg-femsa-red/10 transition-all flex items-center justify-center">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-femsa-red hover:bg-femsa-red/10 transition-all flex items-center justify-center">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class InventoryComponent {
  private dataService = inject(DataService);
  
  searchTerm = '';
  inventory = signal<any[]>([
    { sku: 'BRA-502', nombre: 'Zapatas de Freno Toyota 8FB25', categoria: 'Frenos', cantidad: 4, min: 2, max: 10, estado: EstadoRefaccion.EN_STOCK },
    { sku: 'HYD-112', nombre: 'Manguera Hidráulica 1/2"', categoria: 'Hidráulico', cantidad: 1, min: 5, max: 20, estado: EstadoRefaccion.PEDIDA },
    { sku: 'TYR-990', nombre: 'Llanta Sólida Delantera', categoria: 'Llantas', cantidad: 2, min: 2, max: 6, estado: EstadoRefaccion.EN_STOCK },
    { sku: 'FIL-102', nombre: 'Filtro de Aire Primario', categoria: 'Filtros', cantidad: 15, min: 10, max: 30, estado: EstadoRefaccion.EN_STOCK },
    { sku: 'ELE-441', nombre: 'Sensor de Presencia Asiento', categoria: 'Eléctrico', cantidad: 0, min: 1, max: 5, estado: EstadoRefaccion.POR_RECIBIR },
  ]);

  lowStockCount = computed(() => this.inventory().filter(i => i.cantidad <= i.min).length);
  pendingOrdersCount = computed(() => this.inventory().filter(i => i.estado === EstadoRefaccion.PEDIDA || i.estado === EstadoRefaccion.POR_RECIBIR).length);

  filteredInventory = computed(() => {
    if (!this.searchTerm) return this.inventory();
    const s = this.searchTerm.toLowerCase();
    return this.inventory().filter(i => 
      i.sku.toLowerCase().includes(s) || 
      i.nombre.toLowerCase().includes(s) ||
      i.categoria.toLowerCase().includes(s)
    );
  });

  getStatusClass(estado: EstadoRefaccion): string {
    switch (estado) {
      case EstadoRefaccion.EN_STOCK: return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case EstadoRefaccion.PEDIDA: return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case EstadoRefaccion.POR_RECIBIR: return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  }
}
