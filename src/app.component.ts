import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { DataService } from './services/data.service';
import { GeminiService } from './services/gemini.service';
import { AuthService } from './services/auth.service';
import DOMPurify from 'dompurify';
import template from './app.component.html?raw';

type View = 'home' | 'dashboard' | 'assets' | 'service' | 'solicitor' | 'settings' | 'compliance' | 'inventory' | 'work-orders';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe,
    RouterModule
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
  router = inject(Router);

  // State
  currentUrl = signal<string>('/');
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

    // Router Sync
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl.set(event.urlAfterRedirects);
      this.selectedAssetId.set(null);
      
      // Auto-switch plant mode for dashboard
      const isDashboard = event.urlAfterRedirects.includes('dashboard');
      if (isDashboard && !this.plantMode()) this.dataService.togglePlantMode();
      if (!isDashboard && this.plantMode()) this.dataService.togglePlantMode();
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
    const url = this.currentUrl();
    if (url === '/' || url === '/home') return 'Análisis por Zona';
    if (url.includes('dashboard')) return 'Dashboard Corporativo (NOC)';
    if (url.includes('compliance')) return 'Programa SMP - Cumplimiento';
    if (url.includes('assets')) return 'Gestión de Activos / Flota';
    if (url.includes('service')) return 'Panel de Servicio Técnico Toyota';
    if (url.includes('report')) return 'App Operador (Solicitante)';
    if (url.includes('inventory')) return 'Inventario y Refacciones';
    if (url.includes('work-orders')) return 'Órdenes de Trabajo';
    if (url.includes('admin')) return 'Configuración';
    return 'AssetGuard Advanced';
  }

  get viewSubtitle(): string {
    const url = this.currentUrl();
    if (url === '/' || url === '/home') return 'Estado general por zonas de operación.';
    if (url.includes('dashboard')) return 'KPIs de disponibilidad, seguridad y costos en tiempo real.';
    if (url.includes('compliance')) return 'Seguimiento del programa de mantenimiento sistemático.';
    if (url.includes('assets')) return 'Listado maestro, ubicación y estado de toda la flota.';
    if (url.includes('service')) return 'Administración de órdenes de trabajo y técnicos.';
    if (url.includes('inventory')) return 'Control de stock y alertas de reabastecimiento.';
    if (url.includes('work-orders')) return 'Gestión visual de tareas de mantenimiento.';
    if (url.includes('admin')) return 'Administración del sistema y conexiones.';
    return '';
  }
}
