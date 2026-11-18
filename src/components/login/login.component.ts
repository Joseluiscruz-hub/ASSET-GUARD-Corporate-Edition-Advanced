import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../types';
import { defaultPathForRole } from '../../guards/view-permissions';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div class="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 fade-enter">

        <div class="md:col-span-5 bg-corporate-dark text-white p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 relative overflow-hidden">
          <div class="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none"></div>
          <div class="relative z-10">
            <div class="flex items-center gap-3 mb-8">
              <img src="assets/brand/jl-logo-512.png" alt="JL Automation" class="h-14 w-14 rounded-full ring-1 ring-brand-gold/40 bg-black object-contain">
              <div>
                <p class="text-sm font-bold tracking-wide text-white">JL Automation</p>
                <p class="text-[10px] uppercase tracking-[0.18em] text-brand-gold-soft">Corporate Systems</p>
              </div>
            </div>

            <span class="inline-block px-2.5 py-1 rounded bg-brand-gold/15 border border-brand-gold/40 text-brand-gold text-[10px] font-bold uppercase tracking-widest mb-4">
              AssetGuard · CMMS
            </span>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">AssetGuard</h1>
            <p class="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Corporate Edition Advanced</p>

            <p class="text-sm text-slate-300 mt-6 leading-relaxed">
              Plataforma integral para monitoreo de flota, mantenimiento predictivo con IA, inocuidad HACCP y gestión de órdenes de trabajo.
            </p>
          </div>

          <div class="relative z-10 mt-8 pt-6 border-t border-slate-800 space-y-2.5 text-xs text-slate-400">
            <div class="flex items-center gap-2.5">
              <i class="fas fa-shield-alt text-emerald-400 w-4"></i>
              <span>Control RBAC (Admin, Planeador, Técnico, Visor)</span>
            </div>
            <div class="flex items-center gap-2.5">
              <i class="fas fa-robot text-brand-gold w-4"></i>
              <span>Inspección visual y LOTO con Gemini 2.5 Flash</span>
            </div>
            <div class="flex items-center gap-2.5">
              <i class="fas fa-check-double text-brand-gold-soft w-4"></i>
              <span>Diseñado por JL Automation</span>
            </div>
          </div>
        </div>

        <div class="md:col-span-7 p-6 sm:p-8 bg-white text-slate-800 flex flex-col justify-center">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-extrabold text-slate-900 font-display">
                {{ authMode() === 'login' ? 'Acceso Operativo' : 'Registrar Operador' }}
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Selecciona tu método de autenticación corporativa</p>
            </div>
            <div class="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
              <button type="button" (click)="switchMode('login')"
                [class]="'px-3 py-1.5 rounded-md transition ' + (authMode() === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')">
                Entrar
              </button>
              <button type="button" (click)="switchMode('register')"
                [class]="'px-3 py-1.5 rounded-md transition ' + (authMode() === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')">
                Registro
              </button>
            </div>
          </div>

          @if (authService.error()) {
            <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <i class="fas fa-exclamation-circle mt-0.5 shrink-0"></i>
              <span class="flex-1 font-medium">{{ authService.error() }}</span>
              <button type="button" (click)="authService.clearError()" class="text-red-400 hover:text-red-700">
                <i class="fas fa-times"></i>
              </button>
            </div>
          }

          <form [formGroup]="credentialsForm" (ngSubmit)="submitEmailAuth()" class="space-y-4">
            @if (authMode() === 'register') {
              <div>
                <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nombre Completo</label>
                <input type="text" formControlName="displayName" placeholder="Ej: Ing. Carlos Mendoza"
                  class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none bg-slate-50">
              </div>
            }

            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Correo Corporativo</label>
              <input type="email" formControlName="email" placeholder="usuario@jlautomation.page"
                class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none bg-slate-50">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Contraseña</label>
              <input type="password" formControlName="password" placeholder="Mínimo 6 caracteres"
                class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none bg-slate-50">
            </div>

            <button type="submit" [disabled]="authService.isLoading() || credentialsForm.invalid"
              class="w-full py-3 rounded-lg bg-brand-gold hover:bg-[#c4a02f] disabled:bg-slate-300 disabled:text-slate-500 text-brand-ink font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm">
              @if (authService.isLoading()) {
                <i class="fas fa-circle-notch fa-spin"></i> Verificando acceso...
              } @else {
                <i class="fas fa-sign-in-alt"></i>
                {{ authMode() === 'login' ? 'Iniciar Sesión con Correo' : 'Crear Cuenta de Acceso' }}
              }
            </button>
          </form>

          <div class="my-5 flex items-center gap-3">
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">O continúa con</span>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" (click)="loginGoogle()" [disabled]="authService.isLoading()"
              class="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition border border-slate-900 disabled:opacity-50">
              <i class="fab fa-google text-sm"></i>
              Google Corporativo
            </button>

            <button type="button" (click)="loginDemo()" [disabled]="authService.isLoading()"
              class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition border border-amber-300 disabled:opacity-50">
              <i class="fas fa-bolt text-amber-600"></i>
              Modo Demo ({{ roleLabel(selectedDemoRole()) }})
            </button>
          </div>

          <div class="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span class="text-[11px] text-slate-500 font-medium">
              <i class="fas fa-flask text-slate-400 mr-1"></i> Rol de evaluación para respaldo Demo:
            </span>
            <select [formControl]="demoRoleControl" (change)="onDemoRoleChange()"
              class="text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-md px-2.5 py-1 outline-none focus:ring-2 focus:ring-brand-gold">
              <option value="admin">Administrador (Control Total)</option>
              <option value="planner">Planeador (SMP / OT / Stock)</option>
              <option value="technician">Técnico (Taller / HACCP / LOTO)</option>
              <option value="viewer">Observador (Solo Lectura)</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class LoginComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        void this.router.navigateByUrl(defaultPathForRole(this.authService.userProfile()?.role));
      }
    });
  }


  authMode = signal<'login' | 'register'>('login');
  selectedDemoRole = signal<UserRole>('planner');

  demoRoleControl = new FormControl<UserRole>('planner', { nonNullable: true });

  credentialsForm = new FormGroup({
    displayName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  switchMode(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.authService.clearError();
  }

  onDemoRoleChange(): void {
    this.selectedDemoRole.set(this.demoRoleControl.value);
  }

  roleLabel(role: UserRole): string {
    return this.authService.formatRoleLabel(role);
  }

  async submitEmailAuth(): Promise<void> {
    if (this.credentialsForm.invalid) return;
    const { email, password, displayName } = this.credentialsForm.getRawValue();
    if (this.authMode() === 'register') {
      await this.authService.registerWithEmail(email, password, displayName);
    } else {
      await this.authService.loginWithEmail(email, password);
    }
  }

  async loginGoogle(): Promise<void> {
    await this.authService.loginWithGoogle();
  }

  async loginDemo(): Promise<void> {
    await this.authService.loginDemo(this.selectedDemoRole());
  }
}
