// =======================================================================================
// inventory.component.ts — AssetGuard Corporate Edition Advanced
// Gestión de inventario de refacciones críticas para montacargas.
// Integrado con DataService para niveles de stock y alertas.
// =======================================================================================

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
    <div class="p-6 bg-slate-50 min-h-screen">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span class="material-symbols-outlined text-indigo-600">inventory_2</span>
            Inventario de Refacciones
          </h1>
          <p class="text-slate-500">Gestión de stock crítico y reposición de planta</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95">
            <span class="material-symbols-outlined">add</span>
            Nueva Refacción
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Items</p>
          <p class="text-2xl font-bold text-slate-900">{{ inventory().length }}</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <p class="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Stock Bajo</p>
          <p class="text-2xl font-bold text-slate-900">{{ lowStockCount() }}</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <p class="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Pedidos en Curso</p>
          <p class="text-2xl font-bold text-slate-900">{{ pendingOrdersCount() }}</p>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Valor Inventario</p>
          <p class="text-2xl font-bold text-slate-900">$24.5k</p>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" 
            [(ngModel)]="searchTerm"
            placeholder="Buscar por SKU, descripción o marca..." 
            class="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-xl transition-all outline-none"
          >
        </div>
        <div class="flex gap-2">
          <select class="bg-slate-100 border-transparent focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2 outline-none">
            <option>Todas las categorías</option>
            <option>Frenos</option>
            <option>Hidráulico</option>
            <option>Llantas</option>
            <option>Filtros</option>
          </select>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 border-bottom border-slate-200">
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Refacción</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Actual</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Min / Max</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let item of filteredInventory()" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-bold text-slate-900">{{ item.sku }}</div>
                <div class="text-xs text-slate-500">{{ item.nombre }}</div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                  {{ item.categoria || 'Repuesto' }}
                </span>
              </td>
              <td class="px-6 py-4 font-mono font-bold" [class.text-amber-600]="item.cantidad <= item.min">
                {{ item.cantidad }}
              </td>
              <td class="px-6 py-4 text-slate-500 text-sm">
                {{ item.min }} / {{ item.max }}
              </td>
              <td class="px-6 py-4">
                <span [class]="getStatusClass(item.estado)" class="px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                  {{ item.estado }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  <span class="material-symbols-outlined">edit</span>
                </button>
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
      case EstadoRefaccion.EN_STOCK: return 'bg-emerald-100 text-emerald-700';
      case EstadoRefaccion.PEDIDA: return 'bg-amber-100 text-amber-700';
      case EstadoRefaccion.POR_RECIBIR: return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }
}
