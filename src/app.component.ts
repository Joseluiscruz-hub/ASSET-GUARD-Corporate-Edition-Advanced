import { Component, signal, effect, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { DataService } from './services/data.service';
import { GeminiService } from './services/gemini.service';
import { AuthService } from './services/auth.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AssetListComponent } from './components/admin/asset-list.component';
import { AssetDetailComponent } from './components/asset-detail/asset-detail.component';
import { AdminComponent } from './components/admin/admin.component';
import { ServicePanelComponent } from './components/service-panel.component';
import { SolicitorPanelComponent } from './components/solicitor-panel/solicitor-panel.component';
import { MaintenanceComplianceComponent } from './components/maintenance-compliance/maintenance-compliance.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { WorkOrdersComponent } from './components/work-orders/work-orders.component';
import template from './app.component.html?raw';

type View = 'home' | 'dashboard' | 'assets' | 'service' | 'solicitor' | 'settings' | 'compliance' | 'inventory' | 'work-orders';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe,
    DashboardComponent, 
    AssetListComponent, 
    AssetDetailComponent, 
    AdminComponent, 
    ServicePanelComponent,
    SolicitorPanelComponent,
    MaintenanceComplianceComponent,
    InventoryComponent,
    WorkOrdersComponent
  ],
  template,
  styles: [`
    .fade-enter { animation: fadeIn 0.3s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AppComponent {
  dataService = inject(DataService);
  geminiService = inject(GeminiService);
  authService = inject(AuthService);
  sanitizer = inject(DomSanitizer);

  // State
  currentView = signal<View>('home');
  selectedAssetId = signal<string | null>(null);
  showAiPanel = signal(false);

  // Auth Signals
  user = this.authService.currentUser;
  userProfile = this.authService.userProfile;
  isAuthReady = this.authService.isAuthReady;
  loginError = this.authService.error;
  isLoggingIn = signal(false);

  // Data Signals
  connectionStatus = this.dataService.connectionStatus;
  lastUpdate = this.dataService.lastUpdate;
  plantMode = this.dataService.plantMode;
  failures = this.dataService.forkliftFailures;

  // AI Insights State
  aiInsights = signal<SafeHtml | null>(null);
  aiLoading = signal(false);
  private previousFailureCount = 0;

  // Derived
  syncText = computed(() => {
    if (this.connectionStatus() === 'online') return 'Conectado (Firebase Firestore)';
    if (this.connectionStatus() === 'syncing') return 'Sincronizando...';
    return 'Modo Offline (Solo Lectura)';
  });

  constructor() {
    // Notification Effect
    effect(() => {
      const list = this.failures();
      if (list.length > this.previousFailureCount) {
        const latest = list[0];
        if (latest.estatus === 'Abierta' && this.previousFailureCount > 0) {
          this.playAlert(latest.prioridad === 'Alta');
        }
      }
      this.previousFailureCount = list.length;
    });

    // Custom Events
    window.addEventListener('asset-selected', (e: any) => this.selectedAssetId.set(e.detail));
    window.addEventListener('asset-closed', () => this.selectedAssetId.set(null));
  }

  async loginWithGoogle() {
    this.isLoggingIn.set(true);
    await this.authService.loginWithGoogle();
    this.isLoggingIn.set(false);
  }

  async loginAsDemo() {
    this.isLoggingIn.set(true);
    await this.authService.loginAsDemo();
    this.isLoggingIn.set(false);
  }

  async logout() {
    await this.authService.logout();
  }

  // Navigation Logic
  setView(view: View) {
    this.currentView.set(view);
    this.selectedAssetId.set(null);
    
    // Auto-switch theme based on view context
    if (view === 'dashboard' && !this.plantMode()) this.dataService.togglePlantMode();
    if (view !== 'dashboard' && this.plantMode()) this.dataService.togglePlantMode();
  }

  toggleAiPanel() {
    this.showAiPanel.update(v => !v);
  }

  async generateExecutiveSummary() {
    this.aiLoading.set(true);
    try {
      const kpi = this.dataService.kpiData();
      const availability = this.dataService.fleetAvailability();
      const active = this.failures().filter(f => f.estatus !== 'Cerrada');

      const summary = await this.geminiService.generateExecutiveReport(kpi, active, availability);
      const cleanHtml = DOMPurify.sanitize(summary);
      this.aiInsights.set(this.sanitizer.bypassSecurityTrustHtml(cleanHtml));
    } catch (err) {
      console.error('AI Summary Error:', err);
    } finally {
      this.aiLoading.set(false);
    }
  }

  playAlert(critical: boolean) {
    const audio = new Audio(critical 
      ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' 
      : 'https://assets.mixkit.co/active_storage/sfx/2345/2345-preview.mp3');
    audio.play().catch(() => {});
  }

  get viewTitle(): string {
    switch(this.currentView()) {
      case 'home': return 'Análisis por Zona';
      case 'dashboard': return 'Dashboard Corporativo (NOC)';
      case 'compliance': return 'Programa SMP - Cumplimiento';
      case 'assets': return 'Gestión de Activos / Flota';
      case 'service': return 'Panel de Servicio Técnico Toyota';
      case 'solicitor': return 'App Operador (Solicitante)';
      case 'inventory': return 'Inventario y Refacciones';
      case 'work-orders': return 'Órdenes de Trabajo';
      case 'settings': return 'Configuración';
      default: return 'AssetGuard Advanced';
    }
  }

  get viewSubtitle(): string {
    switch(this.currentView()) {
      case 'home': return 'Estado general por zonas de operación.';
      case 'dashboard': return 'KPIs de disponibilidad, seguridad y costos en tiempo real.';
      case 'compliance': return 'Seguimiento del programa de mantenimiento sistemático.';
      case 'assets': return 'Listado maestro, ubicación y estado de toda la flota.';
      case 'service': return 'Administración de órdenes de trabajo y técnicos.';
      case 'inventory': return 'Control de stock y alertas de reabastecimiento.';
      case 'work-orders': return 'Gestión visual de tareas de mantenimiento.';
      case 'settings': return 'Administración del sistema y conexiones.';
      default: return '';
    }
  }
}
