import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type KpiStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="h-full rounded-[24px] p-6 flex flex-col gap-4 transition-all duration-300 hover-lift relative overflow-hidden group border border-slate-200 dark:border-white/5"
      [ngClass]="containerClasses()"
    >
      <!-- Background elements for premium feel -->
      <div class="absolute -top-12 -right-12 w-32 h-32 bg-femsa-red/5 rounded-full blur-3xl group-hover:bg-femsa-red/10 transition-colors"></div>
      
      <header class="flex items-start justify-between relative z-10">
        <div>
          <h2 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">{{ title() }}</h2>
          <p class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ subtitle() }}</p>
        </div>
        <span [class]="badgeClasses()">
          <span [class]="'h-1.5 w-1.5 rounded-full animate-pulse ' + dotColor()"></span>
          {{ statusText() }}
        </span>
      </header>

      <div class="flex items-baseline gap-2 mt-2 relative z-10">
        <span class="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display">{{ value() }}</span>
        <span class="text-xs font-black text-slate-400 uppercase tracking-widest">{{ unit() }}</span>
      </div>

      <footer class="mt-auto flex items-center justify-between text-[10px] pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
        <div class="flex flex-col">
          <span class="text-slate-400 font-bold uppercase tracking-wider">{{ footerLabel() }}</span>
          <span class="text-slate-900 dark:text-white font-black mt-0.5">{{ footerValue() }}</span>
        </div>
        <div [class]="'px-2 py-1 rounded-md font-black uppercase tracking-tighter ' + trendBgClass()">
          <span [class]="trendClass()">{{ trendLabel() }}</span>
        </div>
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
  footerValue = input<string | number>('');
  trendLabel = input('');

  containerClasses = computed(() => 'bg-white dark:bg-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none');

  badgeClasses = computed(() => {
    const base = 'inline-flex items-center gap-1.5 rounded-full text-[9px] font-black px-3 py-1.5 border uppercase tracking-widest backdrop-blur-md ';
    switch (this.status()) {
      case 'success': return base + 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'warning': return base + 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'danger': return base + 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'info': return base + 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return base + 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  });

  dotColor = computed(() => {
    switch (this.status()) {
      case 'success': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-red-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  });

  trendClass = computed(() => {
    switch (this.status()) {
      case 'success': return 'text-emerald-600 dark:text-emerald-400';
      case 'danger': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-slate-500';
    }
  });

  trendBgClass = computed(() => {
    switch (this.status()) {
      case 'success': return 'bg-emerald-500/5';
      case 'danger': return 'bg-red-500/5';
      case 'warning': return 'bg-amber-500/5';
      case 'info': return 'bg-blue-500/5';
      default: return 'bg-slate-500/5';
    }
  });
}
