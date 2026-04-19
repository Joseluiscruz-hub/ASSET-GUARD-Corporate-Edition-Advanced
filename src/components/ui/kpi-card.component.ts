import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type KpiStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="h-full rounded-2xl border shadow-lg p-4 flex flex-col gap-3 transition-all hover:shadow-xl relative overflow-hidden group"
      [ngClass]="containerClasses()"
    >
      <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
      <header class="flex items-start justify-between relative z-10">
        <div>
          <h2 class="text-sm font-medium text-slate-500 dark:text-slate-300">{{ title() }}</h2>
          <p class="text-xs text-slate-400 mt-0.5">{{ subtitle() }}</p>
        </div>
        <span [class]="badgeClasses()">
          <span [class]="'h-1.5 w-1.5 rounded-full ' + dotColor()"></span>
          {{ statusText() }}
        </span>
      </header>
      <div class="flex items-baseline gap-2 mt-1 relative z-10">
        <span class="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-50">{{ value() }}</span>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">{{ unit() }}</span>
      </div>
      <footer class="mt-auto flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700/50 relative z-10">
        <span>{{ footerLabel() }}: <span class="text-slate-700 dark:text-slate-200 font-medium">{{ footerValue() }}</span></span>
        <span [class]="trendClass()">{{ trendLabel() }}</span>
      </footer>
    </article>
  `
})
export class KpiCardComponent {
  title = input('');
  subtitle = input('');
  value = input<string | number>('');
  unit = input('');
  status = input<KpiStatus>('neutral');
  statusText = input('');
  footerLabel = input('');
  footerValue = input('');
  trendLabel = input('');

  containerClasses = computed(() => 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/60');

  badgeClasses = computed(() => {
    const base = 'inline-flex items-center gap-1.5 rounded-full text-[10px] font-bold px-2.5 py-1 border backdrop-blur-sm ';
    switch (this.status()) {
      case 'success': return base + 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/40';
      case 'warning': return base + 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/40';
      case 'danger': return base + 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/40';
      case 'info': return base + 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/40';
      default: return base + 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  });

  dotColor = computed(() => {
    switch (this.status()) {
      case 'success': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-red-500';
      case 'info': return 'bg-sky-500';
      default: return 'bg-slate-400';
    }
  });

  trendClass = computed(() => {
    if (this.trendLabel().includes('+') && this.status() === 'success') return 'text-emerald-600 dark:text-emerald-400 font-medium';
    if (this.trendLabel().includes('-') && this.status() === 'danger') return 'text-red-600 dark:text-red-400 font-medium';
    if (this.status() === 'warning') return 'text-amber-600 dark:text-amber-400 font-medium';
    return 'text-emerald-600 dark:text-emerald-400 font-medium';
  });
}
