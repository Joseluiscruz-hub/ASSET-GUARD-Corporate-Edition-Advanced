import { describe, it, expect } from 'vitest';
import { canAccessView, getDefaultViewForRole } from '../view-permissions';

describe('RBAC Auth Guard Helpers', () => {
  it('allows admin access to all views including settings', () => {
    expect(canAccessView('settings', 'admin')).toBe(true);
    expect(canAccessView('dashboard', 'admin')).toBe(true);
    expect(canAccessView('solicitor', 'admin')).toBe(true);
  });

  it('restricts viewer from operational mutation views', () => {
    expect(canAccessView('dashboard', 'viewer')).toBe(true);
    expect(canAccessView('home-zones', 'viewer')).toBe(true);
    expect(canAccessView('service', 'viewer')).toBe(false);
    expect(canAccessView('work-orders', 'viewer')).toBe(false);
    expect(canAccessView('solicitor', 'viewer')).toBe(false);
    expect(canAccessView('settings', 'viewer')).toBe(false);
  });

  it('allows technician into service, work-orders, and solicitor but not settings', () => {
    expect(canAccessView('service', 'technician')).toBe(true);
    expect(canAccessView('work-orders', 'technician')).toBe(true);
    expect(canAccessView('solicitor', 'technician')).toBe(true);
    expect(canAccessView('settings', 'technician')).toBe(false);
    expect(getDefaultViewForRole('technician')).toBe('service');
  });

  it('denies access when role is missing', () => {
    expect(canAccessView('dashboard', null)).toBe(false);
    expect(canAccessView('dashboard', undefined)).toBe(false);
  });
});
