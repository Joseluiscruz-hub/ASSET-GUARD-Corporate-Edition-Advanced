// admin.component.ts — Panel Configuración
import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 class="text-lg font-black text-slate-800 dark:text-white mb-1">Configuración del Sistema</h2>
        <p class="text-sm text-slate-500">Administración de conexiones, modo y perfil.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-widest">Estado de Conexión</h3>
          <div class="flex items-center gap-3">
            <div [class]="'w-3 h-3 rounded-full ' + statusColor()"></div>
            <span class="font-bold text-slate-800 dark:text-white">{{ statusText() }}</span>
          </div>
          <p class="text-xs text-slate-400">Última sync: {{ dataService.lastUpdate() | date:'HH:mm:ss' }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-widest">Modo Kiosko</h3>
          <p class="text-xs text-slate-500">Rotación automática de pantallas cada 15s.</p>
          <button (click)="dataService.toggleKioskMode()"
            [class]="'w-full py-2.5 rounded-xl text-sm font-bold transition ' + (dataService.isKioskMode() ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white')">
            {{ dataService.isKioskMode() ? '⏹ Desactivar Kiosko' : '▶ Activar Kiosko' }}
          </button>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
          <h3 class="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-widest">Perfil</h3>
          @if (authService.userProfile()) {
            <dl class="text-sm space-y-2">
              <div class="flex justify-between"><dt class="text-slate-400">Nombre</dt><dd class="font-bold text-slate-800 dark:text-white">{{ authService.userProfile()!.displayName }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-400">Correo</dt><dd class="font-bold text-slate-700 dark:text-slate-300 text-xs">{{ authService.userProfile()!.email }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-400">Rol</dt><dd class="font-bold uppercase text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{{ authService.userProfile()!.role }}</dd></div>
            </dl>
          }
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-2">
          <h3 class="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-widest">Versión</h3>
          <p class="text-xs text-slate-500">AssetGuard Corporate Edition Advanced v1.0</p>
          <p class="text-xs text-slate-500">Angular 19 · Gemini 2.5 Flash · Firebase v11</p>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent {
  dataService = inject(DataService);
  authService = inject(AuthService);
  statusColor() {
    const s = this.dataService.connectionStatus();
    return s === 'online' ? 'bg-emerald-500 animate-pulse' : s === 'syncing' ? 'bg-amber-400' : 'bg-red-500';
  }
  statusText() {
    const s = this.dataService.connectionStatus();
    return s === 'online' ? 'Conectado (Firebase)' : s === 'syncing' ? 'Sincronizando...' : 'Modo Offline';
  }
}
