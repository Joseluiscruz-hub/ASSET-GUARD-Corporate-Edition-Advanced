import { Component, input, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { GeminiService } from '../../services/gemini.service';
import { AIInspectionResponse } from '../../types';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  template: `
    @if (asset()) {
      <div
        class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden animate-fade-in relative"
      >
        <!-- Critical Badge -->
        @if (asset()!.critical) {
          <div
            class="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] uppercase font-black px-4 py-2 rounded-bl-lg z-10 shadow-sm tracking-wide"
          >
            <i class="fas fa-exclamation-triangle mr-1"></i> Prioridad Alta
          </div>
        }

        <!-- Header -->
        <div
          class="bg-brand-red text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-3xl font-black tracking-tight">{{ asset()!.id }}</h2>
              <span
                class="px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-white/20 border border-white/30 backdrop-blur-sm"
              >
                {{ asset()!.status.name }}
              </span>
            </div>
            <p class="text-red-100 font-medium mt-1">
              {{ asset()!.brand }} {{ asset()!.model }} | SN: {{ asset()!.serial }}
            </p>
            <div class="text-xs text-red-200 mt-2 flex gap-2 items-center">
              <span><i class="fas fa-map-marker-alt mr-1"></i>{{ asset()!.location }}</span>
              <span class="w-1 h-1 rounded-full bg-white opacity-50"></span>
              <span><i class="fas fa-gas-pump mr-1"></i>{{ asset()!.fuelType }}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              (click)="close()"
              class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition border border-white/10"
              title="Volver"
            >
              <i class="fas fa-arrow-left"></i>
            </button>
            <button
              (click)="exportPdf()"
              class="px-4 py-2 rounded-lg bg-white text-brand-red hover:bg-gray-100 text-sm font-bold transition shadow-md flex items-center"
            >
              <i class="fas fa-file-pdf mr-2"></i> PDF
            </button>
            <button
              (click)="generateLoto()"
              class="px-4 py-2 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 text-sm font-bold transition shadow-md flex items-center"
            >
              <i class="fas fa-lock mr-2"></i> Generar LOTO
            </button>
          </div>
        </div>

        <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Column 1 & 2: Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Quick Stats -->
            <div class="grid grid-cols-3 gap-4">
              <div class="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 text-center">
                <div class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Combustible
                </div>
                <div class="font-bold text-gray-800 dark:text-white text-lg">{{ asset()!.fuelType }}</div>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 text-center">
                <div class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Adquisición
                </div>
                <div class="font-bold text-gray-800 dark:text-white text-lg">
                  {{ asset()!.acquisitionDate | date: 'MM/yyyy' }}
                </div>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 text-center">
                <div class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Total Fallas
                </div>
                <div class="font-bold text-gray-800 dark:text-white text-lg">{{ history().length }}</div>
              </div>
            </div>

            <!-- Operations Actions Area -->
            <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <h3
                class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"
              >
                <i class="fas fa-cogs"></i> Panel de Control Operativo
              </h3>

              @if (asset()!.status.name === 'Operativo') {
                <!-- Form: Reportar Falla con IA Vision -->
                <div class="bg-red-50 p-5 rounded-lg border border-red-100 relative">
                  <h4 class="text-brand-red font-bold mb-3 flex items-center gap-2">
                    <i class="fas fa-tools"></i> Registrar Ingreso a Taller
                  </h4>

                  <!-- AI Vision Uploader -->
                  <div
                    class="mb-4 p-4 border-2 border-dashed border-red-200 rounded-lg bg-white/50 text-center relative group hover:border-red-400 transition-colors"
                  >
                    <input
                      type="file"
                      (change)="handleImageUpload($event)"
                      accept="image/*"
                      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div class="flex flex-col items-center gap-2">
                      <i class="fas fa-camera text-2xl text-red-300 group-hover:text-red-500"></i>
                      <p class="text-xs font-bold text-red-800 uppercase">Inspección Visual IA</p>
                      <p class="text-[10px] text-gray-500">
                        Sube una foto de la avería para autocompletar
                      </p>
                    </div>
                    @if (analyzingImage()) {
                      <div
                        class="absolute inset-0 bg-white/90 z-20 flex items-center justify-center text-brand-red font-bold text-xs gap-2"
                      >
                        <i class="fas fa-spinner fa-spin"></i> Analizando daños...
                      </div>
                    }
                  </div>

                  <div class="flex flex-col gap-3">
                    <select
                      #failType
                      class="w-full p-2.5 border border-gray-300 rounded text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none"
                      [value]="
                        inspectionData()?.inspection?.damage_analysis?.damage_type || 'Mecánico'
                      "
                    >
                      <option value="Mecánico">Falla Mecánica</option>
                      <option value="Eléctrico">Falla Eléctrica</option>
                      <option value="Hidráulico">Sistema Hidráulico</option>
                      <option value="Llantas">Llantas / Rodaje</option>
                      <option value="Estructural">Estructural</option>
                      <option value="Operador">Daño por Operación</option>
                    </select>

                    <!-- Auto-filled description -->
                    <textarea
                      #failDesc
                      class="w-full p-2.5 border border-gray-300 rounded text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none"
                      rows="3"
                      placeholder="Describe la falla detalladamente..."
                      [value]="
                        inspectionData()
                          ? inspectionData()?.inspection?.asset?.visual_condition +
                            ' - Causa Probable: ' +
                            inspectionData()?.inspection?.root_cause_analysis?.probable_cause
                          : ''
                      "
                    ></textarea>

                    <!-- AI Analysis Result Preview -->
                    @if (inspectionData()) {
                      <div
                        class="bg-white p-3 rounded border border-red-100 text-xs text-gray-600 mb-2"
                      >
                        <p>
                          <strong class="text-red-700">Severidad Detectada:</strong>
                          {{ inspectionData()?.inspection?.severity?.level }}
                        </p>
                        <p><strong class="text-red-700">Refacciones Sugeridas:</strong></p>
                        <ul class="list-disc pl-4 mt-1">
                          @for (
                            part of inspectionData()?.inspection?.repair_plan?.estimated_parts;
                            track part.part_name
                          ) {
                            <li>
                              {{ part.quantity }}x {{ part.part_name }} ({{ part.generic_code }})
                            </li>
                          }
                        </ul>
                      </div>
                    }

                    <button
                      (click)="reportFailure(failDesc.value, failType.value)"
                      class="w-full bg-brand-red hover:bg-brand-red/80 text-white font-bold py-2.5 rounded transition uppercase tracking-wide text-xs"
                    >
                      Confirmar Ingreso
                    </button>
                  </div>
                </div>
              } @else if (asset()!.status.name === 'Taller') {
                <!-- Form: Finalizar Reparacion -->
                <div class="bg-green-50 p-5 rounded-lg border border-green-100">
                  <h4 class="text-green-800 font-bold mb-3 flex items-center gap-2">
                    <i class="fas fa-check-circle"></i> Finalizar y Liberar Equipo
                  </h4>
                  <div class="flex flex-col gap-3">
                    <textarea
                      #diagnosis
                      class="w-full p-2.5 border border-green-200 rounded text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
                      rows="2"
                      placeholder="Diagnóstico final y solución..."
                    ></textarea>
                    <div class="grid grid-cols-2 gap-3">
                      <input
                        #cost
                        type="number"
                        class="p-2.5 border border-green-200 rounded text-sm bg-white"
                        placeholder="Costo Refacciones ($)"
                      />
                      <input
                        #parts
                        type="text"
                        class="p-2.5 border border-green-200 rounded text-sm bg-white"
                        placeholder="Refacciones (separar por coma)"
                      />
                    </div>
                    <button
                      (click)="finishRepair(diagnosis.value, cost.value, parts.value)"
                      class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded transition uppercase tracking-wide text-xs"
                    >
                      Liberar Equipo a Operación
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- History Table -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="h-6 w-1 bg-brand-red"></div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-white">Historial Clínico</h3>
              </div>
              <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                <table class="w-full text-sm text-left min-w-[800px]">
                  <thead
                    class="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider"
                  >
                    <tr>
                      <th class="p-3 whitespace-nowrap">Fecha</th>
                      <th class="p-3">Falla</th>
                      <th class="p-3">Diagnóstico</th>
                      <th class="p-3">Refacciones</th>
                      <th class="p-3">Tipo</th>
                      <th class="p-3 text-right">Costo</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
                    @for (item of history(); track item.id) {
                      <tr
                        class="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                        [class.bg-red-50]="!item.exitDate"
                        [class.border-l-4]="!item.exitDate"
                        [class.border-brand-red]="!item.exitDate"
                      >
                        <td class="p-3 text-gray-600 dark:text-slate-400 align-top whitespace-nowrap font-medium">
                          {{ item.entryDate | date: 'shortDate' }}
                          @if (!item.exitDate) {
                            <span
                              class="inline-block px-2 py-0.5 rounded bg-brand-red text-white text-[10px] font-bold mt-1 ml-2"
                            >
                              ABIERTO
                            </span>
                          }
                        </td>
                        <td class="p-3 text-gray-900 dark:text-slate-100 align-top font-medium">
                          {{ item.failureDescription }}
                        </td>
                        <td class="p-3 text-gray-600 dark:text-slate-400 text-xs align-top max-w-[200px]">
                          {{ item.diagnosis || '-' }}
                        </td>
                        <td class="p-3 text-gray-600 dark:text-slate-400 text-xs align-top max-w-[200px]">
                          @if (item.partsUsed && item.partsUsed.length > 0) {
                            <div class="flex flex-wrap gap-1.5">
                              @for (part of item.partsUsed; track $index) {
                                <span
                                  class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200"
                                >
                                  {{ part }}
                                </span>
                              }
                            </div>
                          } @else {
                            <span class="text-gray-400 italic text-xs">N/A</span>
                          }
                        </td>
                        <td class="p-3 align-top">
                          <span
                            class="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded whitespace-nowrap"
                            >{{ item.type }}</span
                          >
                        </td>
                        <td
                          class="p-3 text-right font-mono text-gray-900 dark:text-white font-bold align-top whitespace-nowrap"
                        >
                          {{ item.estimatedCost | currency }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Column 3: AI Sidebar -->
          <div class="space-y-6">
            <div
              class="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-gray-800 text-white shadow-xl"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 bg-brand-red text-white rounded shadow-sm">
                  <i class="fas fa-robot text-lg"></i>
                </div>
                <!-- Cleaned up title as requested -->
                <h3 class="text-lg font-bold">Mantenimiento Predictivo</h3>
              </div>

              <p class="text-sm text-gray-400 mb-6 leading-relaxed">
                Gemini AI analiza patrones de desgaste, MTBF y condiciones de uso para predecir
                fallas futuras.
              </p>

              @if (aiLoading()) {
                <div class="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <div class="relative">
                    <i class="fas fa-circle-notch fa-spin text-3xl text-brand-red"></i>
                    <i
                      class="fas fa-brain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white"
                    ></i>
                  </div>
                  <p class="text-xs font-bold text-gray-300 animate-pulse uppercase tracking-wide">
                    Analizando historial y sensores...
                  </p>
                </div>
              } @else if (aiResult()) {
                <div
                  class="prose prose-sm prose-invert bg-white/5 p-4 rounded-lg border border-white/10 max-h-96 overflow-y-auto custom-scroll text-sm"
                  [innerHTML]="aiResult()"
                ></div>
                <button
                  (click)="runAnalysis()"
                  class="mt-4 w-full py-2 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wide border border-gray-700 rounded hover:bg-gray-800 transition"
                >
                  Regenerar Análisis
                </button>
              } @else {
                <div class="bg-white/5 rounded-lg p-3 mb-4 border border-white/10">
                  <p class="text-[10px] text-gray-400 italic mb-1">
                    <i class="fas fa-info-circle mr-1"></i> Esto enviará los últimos 20 reportes a
                    Gemini.
                  </p>
                </div>
                <button
                  (click)="runAnalysis()"
                  class="w-full py-3 bg-brand-red hover:bg-brand-red/80 text-white rounded-lg font-bold shadow-lg shadow-red-900/20 transition flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                >
                  <i class="fas fa-magic"></i> Ejecutar Predicción con IA
                </button>
              }
            </div>

            <!-- LOTO Result -->
            @if (lotoResult()) {
              <div class="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-lg">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="font-black text-yellow-800 flex items-center gap-2">
                    <i class="fas fa-lock"></i> Procedimiento LOTO
                  </h3>
                  <button (click)="lotoResult.set(null)" class="text-yellow-600 hover:text-black">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div
                  class="prose prose-sm prose-yellow max-h-64 overflow-y-auto custom-scroll"
                  [innerHTML]="lotoResult()"
                ></div>
                <button
                  (click)="printLoto()"
                  class="w-full mt-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded uppercase text-xs"
                >
                  <i class="fas fa-print mr-1"></i> Imprimir Etiqueta
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
  ]
})
export class AssetDetailComponent {
  assetId = input<string>('');

  private dataService = inject(DataService);
  private geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute, { optional: true });

  resolvedAssetId = computed(
    () => this.assetId() || this.route?.snapshot.paramMap.get('id') || ''
  );

  asset = computed(() => this.dataService.getAsset(this.resolvedAssetId()));
  history = computed(() =>
    this.resolvedAssetId() ? this.dataService.getAssetHistory(this.resolvedAssetId()) : []
  );

  aiLoading = signal(false);
  aiResult = signal<SafeHtml | string | null>(null);

  // New Signals for Prompts
  analyzingImage = signal(false);
  inspectionData = signal<AIInspectionResponse | null>(null);
  lotoResult = signal<string | null>(null);

  constructor() {
    effect(
      () => {
        // Reset state when asset changes
        this.resolvedAssetId();
        this.aiResult.set(null);
        this.inspectionData.set(null);
        this.lotoResult.set(null);
      },
      { allowSignalWrites: true }
    );
  }

  // --- Actions ---

  // Prompt 2: Image Upload Handler
  handleImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.analyzingImage.set(true);
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      const resultStr = String(e.target?.result || '');
      const base64Data = resultStr.split(',')[1];
      try {
        const result = await this.geminiService.analyzeImage(base64Data, file.type || 'image/jpeg');
        this.inspectionData.set(result);
      } catch {
        this.inspectionData.set(null);
      } finally {
        this.analyzingImage.set(false);
      }
    };
    reader.readAsDataURL(file);
  }

  // Bonus 3: Generate LOTO
  async generateLoto() {
    const currentAsset = this.asset();
    if (!currentAsset) return;

    // Uses the last failure or a generic context
    const lastFailure = currentAsset.lastFailure || 'Mantenimiento General Preventivo';

    this.lotoResult.set(
      '<p class="text-gray-500 animate-pulse">Generando procedimiento de seguridad...</p>'
    );
    const html = await this.geminiService.generateLotoProcedure(currentAsset, lastFailure);
    this.lotoResult.set(DOMPurify.sanitize(html));
  }

  printLoto() {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow && this.lotoResult()) {
      const cleanHtml = DOMPurify.sanitize(this.lotoResult()!);
      printWindow.document.write('<html><head><title>LOTO</title>');
      printWindow.document.write('</head><body class="p-8">');
      printWindow.document.write(cleanHtml);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  }

  reportFailure(desc: string, type: any) {
    if (!desc) return alert('Por favor describe la falla.');
    this.dataService.reportFailure(this.resolvedAssetId(), desc, type);
  }

  finishRepair(diag: string, costStr: string, partsStr: string) {
    if (!diag) return alert('El diagnóstico es requerido.');
    const cost = parseFloat(costStr) || 0;
    const parts = partsStr
      .split(',')
      .map(p => p.trim())
      .filter(p => p);

    this.dataService.completeRepair(this.resolvedAssetId(), diag, cost, parts);
  }

  async runAnalysis() {
    const currentAsset = this.asset();
    if (!currentAsset) return;

    this.aiLoading.set(true);
    try {
      const result = await this.geminiService.analyzeMaintenanceHistory(currentAsset, this.history());
      this.aiResult.set(this.sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(result)));
    } catch {
      this.aiResult.set(null);
    } finally {
      this.aiLoading.set(false);
    }
  }

  async exportPdf() {
    let jsPDF: any;
    try {
      const jspdfMod: any = await import('jspdf');
      jsPDF = jspdfMod.jsPDF ?? jspdfMod.default ?? jspdfMod;
    } catch {
      window.print();
      return;
    }
    const doc = new jsPDF();
    const currentAsset = this.asset();
    if (!currentAsset) return;

    doc.setFontSize(20);
    doc.setTextColor(206, 17, 38); // brand-red
    doc.text(`Historial Clínico: ${currentAsset.id}`, 14, 20);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Marca: ${currentAsset.brand} | Modelo: ${currentAsset.model}`, 14, 28);
    doc.text(`Serie: ${currentAsset.serial} | Estatus: ${currentAsset.status.name}`, 14, 33);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 38);

    // Table (autoTable library not available, using simple text export)
    const tableData = this.history().map(row => [
      new Date(row.entryDate).toLocaleDateString(),
      row.failureDescription,
      row.diagnosis || '-',
      (row.partsUsed || []).join(', '),
      `$${row.estimatedCost}`
    ]);

    // Simple text table since autoTable is not available
    let y = 50;
    doc.text('Historial de Fallas:', 14, y);
    y += 10;
    tableData.forEach((row, index) => {
      doc.text(`${index + 1}. ${row[0]} - ${row[1]}`, 14, y);
      y += 5;
      if (y > 280) {
        // New page if needed
        doc.addPage();
        y = 20;
      }
    });

    /*
    // Original autoTable code - requires jspdf-autotable library
    autoTable(doc, {
      startY: 45,
      head: [['Fecha', 'Falla', 'Diagnóstico', 'Refacciones', 'Costo']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [206, 17, 38] } // brand-red
    });
    */

    doc.save(`historial_${currentAsset.id}.pdf`);
  }

  close() {
    window.dispatchEvent(new CustomEvent('asset-closed'));
  }
}
