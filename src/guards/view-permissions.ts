import { AppView, UserRole } from '../types';

export const VIEW_PERMISSIONS: Record<AppView, UserRole[]> = {
  dashboard: ['admin', 'planner', 'technician', 'viewer'],
  'home-zones': ['admin', 'planner', 'technician', 'viewer'],
  compliance: ['admin', 'planner', 'technician', 'viewer'],
  service: ['admin', 'planner', 'technician'],
  'work-orders': ['admin', 'planner', 'technician'],
  inventory: ['admin', 'planner', 'technician', 'viewer'],
  assets: ['admin', 'planner', 'technician', 'viewer'],
  solicitor: ['admin', 'technician'],
  settings: ['admin'],
  refurbishment: ['admin', 'planner', 'technician'],
};

export function canAccessView(view: AppView, role: UserRole | undefined | null): boolean {
  if (!role) return false;
  const allowed = VIEW_PERMISSIONS[view];
  return allowed ? allowed.includes(role) : false;
}

export function getDefaultViewForRole(role: UserRole | undefined | null): AppView {
  if (role === 'technician') return 'service';
  return 'dashboard';
}

export function defaultPathForRole(role: UserRole | undefined | null): string {
  const view = getDefaultViewForRole(role);
  switch (view) {
    case 'service': return '/service';
    default: return '/dashboard';
  }
}
