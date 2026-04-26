
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Asset } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="space-y-6 relative">
       
       <!-- Summary Header -->
       <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <p class="text-xs text-slate-500 uppercase font-bold">Total Listado</p>
             <p class="text-2xl font-black text-slate-800">{{ stats().total }}</p>
          </div>
          <div class="bg-white p-4 rounded-xl border-l-4 border-emerald-500 shadow-sm">
             <p class="text-xs text-slate-500 uppercase font-bold">Operativos</p>
             <p class="text-2xl font-black text-emerald-600">{{ stats().operative }}</p>
          </div>
          <div class="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm">
             <p class="text-xs text-slate-500 uppercase font-bold">En Taller</p>
             <p class="text-2xl font-black text-red-600">{{ stats().maintenance }}</p>
          </div>
          <div class="bg-white p-4 rounded-xl border-l-4 border-amber-500 shadow-sm">
             <p class="text-xs text-slate-500 uppercase font-bold">Preventivo</p>
             <p class="text-2xl font-black text-amber-600">{{ stats().preventive }}</p>
          </div>
          <div class="bg-white p-4 rounded-xl border-l-4 border-orange-600 shadow-sm">
             <p class="text-xs text-slate-500 uppercase font-bold">Críticos</p>
             <p class="text-2xl font-black text-orange-600">{{ stats().critical }}</p>
          </div>
       </div>

       <!-- Toolbar -->
       <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h2 class="font-bold text-slate-700">Inventario Detallado</h2>
          
          <div class="flex gap-3 w-full md:w-auto">
             <div class="relative flex-1 md:w-64">
                <i class="fas fa-search absolute left-3 top-3 text-slate-400 text-xs"></i>
                <input type="text" 
                       placeholder="Buscar por ID, Serie o Marca..." 
                       (input)="filter.set($any($event.target).value)"
                       class="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
             </div>
             
             <button (click)="generateExecutiveReport()" 
                     [disabled]="isGenerating()"
                     class="px-4 py-2 bg-[#ce1126] hover:bg-[#a30d1d] text-white text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-wait">
                @if(isGenerating()) {
                    <i class="fas fa-spinner fa-spin"></i> Generando...
                } @else {
                    <i class="fas fa-file-pdf"></i> Reporte Ejecutivo
                }
             </button>
          </div>
       </div>

       <!-- Table -->
       <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="overflow-x-auto">
             <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                   <tr>
                      <th class="p-4">ID Economico</th>
                      <th class="p-4">Detalles</th>
                      <th class="p-4">Ubicación</th>
                      <th class="p-4">Estatus Actual</th>
                      <th class="p-4">Supervisor</th>
                      <th class="p-4 text-right">Acción</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                   @for (asset of filteredAssets(); track asset.id) {
                      <tr class="transition-colors group cursor-pointer border-l-4 relative" 
                          [ngClass]="{'hover:bg-slate-50 border-transparent': !isCriticalMaintenance(asset), 'border-red-500 bg-red-50': isCriticalMaintenance(asset)}"
                          (click)="selectAsset(asset)"
                          (mouseenter)="showTooltip($event, asset)"
                          (mousemove)="moveTooltip($event)"
                          (mouseleave)="hideTooltip()">
                         <td class="p-4 font-black text-slate-800">
                            <div class="flex items-center gap-2">
                               {{ asset.id }}
                               @if (asset.critical && asset.status.name === 'Operativo') {
                                  <div class="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" title="Activo de Alta Prioridad"></div>
                               }
                            </div>
                         </td>
                         <td class="p-4">
                            <div class="font-bold text-slate-700">{{ asset.brand }} {{ asset.model }}</div>
                            <div class="text-xs text-slate-400 font-mono">SN: {{ asset.serial }}</div>
                         </td>
                         <td class="p-4 text-slate-600">
                            <i class="fas fa-map-marker-alt text-slate-300 mr-1"></i> {{ asset.location }}
                         </td>
                         <td class="p-4">
                            <div class="flex flex-wrap items-center gap-2">
                                <span [class]="'inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-black border shadow-sm ' + asset.status.color">
                                   <i class="fas fa-circle text-[6px] mr-1.5 opacity-70"></i>
                                   {{ asset.status.name }}
                                </span>

                                @if (asset.critical) {
                                   <span class="inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase font-black bg-orange-600 text-white shadow-sm ring-1 ring-orange-700/50">
                                      <i class="fas fa-bolt mr-1 text-[8px]"></i> CRÍTICO
                                   </span>
                                }

                                @if (isCriticalMaintenance(asset)) {
                                   <span class="inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase font-black bg-red-600 text-white shadow-sm animate-pulse ring-1 ring-red-700/50" title="Atención requerida: Tiempo excedido">
                                      <i class="fas fa-clock mr-1 text-[8px]"></i> +48H
                                   </span>
                                }
                            </div>
                            
                            @if (asset.status.name !== 'Operativo') {
                               <div class="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1.5 font-medium pl-1">
                                  <i class="fas fa-history text-[8px] opacity-70"></i>
                                  Desde: {{ asset.statusSince | date:'dd MMM, HH:mm' }}
                               </div>
                            }
                         </td>
                         <td class="p-4 text-slate-600 text-xs">
                            {{ asset.supervisor || 'N/A' }}
                         </td>
                         <td class="p-4 text-right">
                            <button class="text-slate-400 hover:text-blue-600 group-hover:translate-x-1 transition-transform">
                               <i class="fas fa-arrow-right"></i>
                            </button>
                         </td>
                      </tr>
                   } @empty {
                      <tr>
                         <td colspan="6" class="p-8 text-center text-slate-400 italic">No se encontraron activos.</td>
                      </tr>
                   }
                </tbody>
             </table>
          </div>
       </div>

       <!-- HOVER TOOLTIP -->
       @if (hoveredAsset()) {
         <div class="fixed z-[9999] bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-lg shadow-2xl pointer-events-none text-xs border border-slate-700 min-w-[200px]"
              [style.left.px]="tooltipPos().x"
              [style.top.px]="tooltipPos().y">
            <div class="border-b border-slate-700 pb-2 mb-2">
                <div class="font-bold text-white text-sm">{{ hoveredAsset()?.brand }} {{ hoveredAsset()?.model }}</div>
                <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Información Adicional</div>
            </div>
            <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
               <span class="text-slate-400 font-medium">SAP:</span> 
               <span class="font-mono text-emerald-400 font-bold">{{ hoveredAsset()?.sapCode || 'N/A' }}</span>
               
               <span class="text-slate-400 font-medium">Combustible:</span> 
               <span class="font-bold">{{ hoveredAsset()?.fuelType }}</span>
               
               <span class="text-slate-400 font-medium">Adquisición:</span> 
               <span>{{ hoveredAsset()?.acquisitionDate | date:'MMMM yyyy' }}</span>

               <span class="text-slate-400 font-medium">Hrs Uso:</span> 
               <span>{{ hoveredAsset()?.operatingHours | number }} hrs</span>
            </div>
         </div>
       }
    </div>
  `
})
export class AssetListComponent {
  dataService = inject(DataService);
  filter = signal('');
  isGenerating = signal(false);
  
  // Tooltip State
  hoveredAsset = signal<Asset | null>(null);
  tooltipPos = signal({ x: 0, y: 0 });
  
  filteredAssets = computed(() => {
     const text = this.filter().toLowerCase();
     return this.dataService.assets().filter(a => 
        a.id.toLowerCase().includes(text) || 
        a.brand.toLowerCase().includes(text) ||
        a.serial.toLowerCase().includes(text)
     );
  });

  stats = computed(() => {
     // Now uses filteredAssets for dynamic updates
     const assets = this.filteredAssets();
     return {
        total: assets.length,
        operative: assets.filter(a => a.status.name === 'Operativo').length,
        maintenance: assets.filter(a => a.status.name === 'Taller').length,
        preventive: assets.filter(a => a.status.name === 'Preventivo').length,
        critical: assets.filter(a => a.critical).length
     };
  });

  selectAsset(asset: Asset) {
    window.dispatchEvent(new CustomEvent('asset-selected', { detail: asset.id }));
  }

  isCriticalMaintenance(asset: Asset): boolean {
    if (asset.status.name !== 'Taller' || !asset.statusSince) return false;
    const start = new Date(asset.statusSince).getTime();
    const now = new Date().getTime();
    // 48 hours in milliseconds = 48 * 60 * 60 * 1000 = 172,800,000
    return (now - start) > 172800000;
  }

  // --- Tooltip Logic ---
  showTooltip(event: MouseEvent, asset: Asset) {
    this.hoveredAsset.set(asset);
    this.moveTooltip(event);
  }

  moveTooltip(event: MouseEvent) {
    // Add offset so it doesn't cover cursor
    this.tooltipPos.set({ x: event.clientX + 16, y: event.clientY + 16 });
  }

  hideTooltip() {
    this.hoveredAsset.set(null);
  }

  // --- PDF REPORT GENERATION ---
  generateExecutiveReport() {
    this.isGenerating.set(true);

    // Use setTimeout to unblock the UI render
    setTimeout(() => {
        try {
            const doc = new jsPDF();
            const stats = this.stats();
            // Use filtered assets for report to match view
            const reportAssets = this.filteredAssets();
            
            const dateStr = new Date().toLocaleDateString();
            const timeStr = new Date().toLocaleTimeString();

            // -- Header Band --
            doc.setFillColor(206, 17, 38); // Brand Red
            doc.rect(0, 0, 210, 24, 'F');
            
            // Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('ASSET GUARD | REPORTE EJECUTIVO DE FLOTA', 14, 15);
            
            // Subtitle Info
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Planta: Cuautitlán Izcalli  |  Generado: ${dateStr} ${timeStr}`, 14, 28);

            // -- Executive Summary Cards (Simulated) --
            
            // Background for summary
            doc.setFillColor(248, 250, 252); // Slate 50
            doc.setDrawColor(226, 232, 240); // Slate 200
            doc.roundedRect(14, 35, 182, 28, 2, 2, 'FD');

            const startY = 42;
            const colWidth = 45;
            
            // Metric 1: Total
            doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.setFont('helvetica', 'bold'); 
            doc.text('TOTAL ACTIVOS', 20, startY);
            doc.setTextColor(30, 41, 59); doc.setFontSize(14); 
            doc.text(stats.total.toString(), 20, startY + 8);

            // Metric 2: Operative
            doc.setTextColor(100, 116, 139); doc.setFontSize(8); 
            doc.text('OPERATIVOS', 20 + colWidth, startY);
            doc.setTextColor(22, 163, 74); // Green
            doc.setFontSize(14); 
            doc.text(stats.operative.toString(), 20 + colWidth, startY + 8);

            // Metric 3: Maintenance
            doc.setTextColor(100, 116, 139); doc.setFontSize(8); 
            doc.text('EN TALLER', 20 + colWidth * 2, startY);
            doc.setTextColor(220, 38, 38); // Red
            doc.setFontSize(14); 
            doc.text(stats.maintenance.toString(), 20 + colWidth * 2, startY + 8);

            // Metric 4: Availability
            const availability = stats.total > 0 ? ((stats.operative / stats.total) * 100).toFixed(1) + '%' : '0%';
            doc.setTextColor(100, 116, 139); doc.setFontSize(8); 
            doc.text('DISPONIBILIDAD', 20 + colWidth * 3, startY);
            doc.setTextColor(15, 23, 42); // Slate 900
            doc.setFontSize(14); 
            doc.text(availability, 20 + colWidth * 3, startY + 8);

            // -- Detailed Table --
            const tableData = reportAssets.map(a => [
              a.id,
              `${a.brand} ${a.model}`,
              a.serial,
              a.status.name,
              a.location,
              a.supervisor || 'N/A'
            ]);

            autoTable(doc, {
              startY: 70,
              head: [['ID', 'Marca / Modelo', 'Serie', 'Estatus', 'Ubicación', 'Supervisor']],
              body: tableData,
              theme: 'grid', // 'striped' | 'grid' | 'plain'
              headStyles: { 
                fillColor: [30, 41, 59], // Slate 800
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
              },
              styles: {
                fontSize: 8,
                cellPadding: 4,
                valign: 'middle'
              },
              columnStyles: {
                0: { fontStyle: 'bold' }, // ID bold
                3: { fontStyle: 'bold' }  // Status bold
              },
              alternateRowStyles: {
                fillColor: [248, 250, 252]
              },
              didParseCell: (data) => {
                // Dynamic Status Colors
                if (data.section === 'body' && data.column.index === 3) {
                   const status = data.cell.raw as string;
                   if (status === 'Operativo') data.cell.styles.textColor = [22, 163, 74];
                   else if (status === 'Taller') data.cell.styles.textColor = [220, 38, 38];
                   else if (status === 'Preventivo') data.cell.styles.textColor = [217, 119, 6];
                   else data.cell.styles.textColor = [100, 116, 139];
                }
              }
            });

            // -- Footer --
            const pageCount = (doc as any).internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184); // Slate 400
                doc.text(`Página ${i} de ${pageCount}`, 195, 285, { align: 'right' });
                doc.text(`Generado por AssetGuard CMMS - Documento Confidencial`, 14, 285);
            }

            doc.save(`Reporte_Flota_${dateStr.replace(/\//g, '-')}.pdf`);
        } catch (e) {
            console.error("Error generating report", e);
            console.warn('ALERT:', "Error al generar el PDF. Por favor intente de nuevo.");
        } finally {
            this.isGenerating.set(false);
        }
    }, 100);
  }
}
