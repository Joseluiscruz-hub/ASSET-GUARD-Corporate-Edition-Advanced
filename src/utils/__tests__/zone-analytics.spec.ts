import { describe, it, expect } from 'vitest';
import { computeZoneAnalytics } from '../zone-analytics';
import type { Asset, ForkliftFailureEntry, Status } from '../../types';

const OPERATIVO: Status = { id: '1', name: 'Operativo', color: '', hex: '#10b981' };
const TALLER: Status = { id: '2', name: 'Taller', color: '', hex: '#ef4444' };
const PREVENTIVO: Status = { id: '3', name: 'Preventivo', color: '', hex: '#f59e0b' };

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    id: 'A-1',
    brand: 'Toyota',
    model: '8FGU30',
    serial: 'S-1',
    acquisitionDate: '2024-01-01',
    fuelType: 'Gas LP',
    status: OPERATIVO,
    statusSince: '2026-01-01T00:00:00Z',
    location: 'Zona Sur',
    critical: false,
    cleanlinessStatus: 'Sanitized',
    ...overrides,
  };
}

describe('computeZoneAnalytics', () => {
  it('groups assets by location and calculates availability & HACCP compliance', () => {
    const assets: Asset[] = [
      makeAsset({ id: '35526', location: 'Embotellado', status: OPERATIVO, cleanlinessStatus: 'Sanitized', critical: true }),
      makeAsset({ id: '35527', location: 'Embotellado', status: TALLER, cleanlinessStatus: 'Critical', critical: true }),
      makeAsset({ id: '37191', location: 'Almacén MP', status: PREVENTIVO, cleanlinessStatus: 'Pending' }),
    ];

    const failures: ForkliftFailureEntry[] = [
      {
        id: 'F-1',
        economico: '35527',
        falla: 'Fuga hidráulica',
        reporta: 'Op',
        fechaIngreso: '2026-03-01T10:00:00Z',
        prioridad: 'Alta',
        estatus: 'Abierta',
        seguimiento: [],
      },
      {
        id: 'F-2',
        economico: '35526',
        falla: 'Cerrada',
        reporta: 'Op',
        fechaIngreso: '2026-02-01T10:00:00Z',
        prioridad: 'Media',
        estatus: 'Cerrada',
        seguimiento: [],
      },
    ];

    const result = computeZoneAnalytics(assets, failures);
    expect(result).toHaveLength(2);

    const emb = result.find((z) => z.zone === 'Embotellado');
    expect(emb).toBeDefined();
    expect(emb?.totalAssets).toBe(2);
    expect(emb?.operativeCount).toBe(1);
    expect(emb?.tallerCount).toBe(1);
    expect(emb?.activeFailuresCount).toBe(1);
    expect(emb?.availabilityPct).toBe(50);
    expect(emb?.haccpCompliancePct).toBe(50);
    expect(emb?.haccpCriticalCount).toBe(1);

    const alm = result.find((z) => z.zone === 'Almacén MP');
    expect(alm?.preventiveCount).toBe(1);
    expect(alm?.haccpPendingCount).toBe(1);
    expect(alm?.availabilityPct).toBe(0);
  });

  it('sorts zones with lower availability first', () => {
    const assets: Asset[] = [
      makeAsset({ id: '1', location: 'Zona A', status: OPERATIVO }),
      makeAsset({ id: '2', location: 'Zona B', status: TALLER }),
    ];
    const result = computeZoneAnalytics(assets, []);
    expect(result[0].zone).toBe('Zona B');
    expect(result[1].zone).toBe('Zona A');
  });
});
