// =======================================================================================
// real-fleet.ts — AssetGuard Corporate Edition Advanced
// Synthetic demo fleet data (not a real plant / not a real fleet).
// Used so the UI can render assets, KPIs and maintenance views in the public demo.
// =======================================================================================

import { Asset, Status } from '../types';

const RAW_FLEET: Omit<Asset, 'status' | 'cleanlinessStatus'>[] = [
  { id: 'DEMO-001', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-001',  acquisitionDate: '2019-03-01', fuelType: 'Gas LP',    location: 'Pasillo 4',     critical: true,  supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0001', operatingHours: 14200, statusSince: new Date().toISOString() },
  { id: 'DEMO-002', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-002',  acquisitionDate: '2019-03-01', fuelType: 'Gas LP',    location: 'Pasillo 2',     critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0002', operatingHours: 13850, statusSince: new Date().toISOString() },
  { id: 'DEMO-003', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-003',  acquisitionDate: '2019-03-01', fuelType: 'Gas LP',    location: 'Andén 3',      critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0003', operatingHours: 13900, statusSince: new Date().toISOString() },
  { id: 'DEMO-004', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-004',  acquisitionDate: '2019-04-01', fuelType: 'Gas LP',    location: 'Pasillo 1',     critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0004', operatingHours: 12400, statusSince: new Date().toISOString() },
  { id: 'DEMO-005', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-005',  acquisitionDate: '2020-06-01', fuelType: 'Gas LP',    location: 'Pasillo 5',     critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0005', operatingHours: 10200, statusSince: new Date().toISOString() },
  { id: 'DEMO-006', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-006',  acquisitionDate: '2020-06-01', fuelType: 'Gas LP',    location: 'Andén 1',      critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0006', operatingHours: 10100, statusSince: new Date().toISOString() },
  { id: 'DEMO-007', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-007',  acquisitionDate: '2020-06-01', fuelType: 'Gas LP',    location: 'Pasillo 6',     critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0007', operatingHours: 9800,  statusSince: new Date().toISOString() },
  { id: 'DEMO-008', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-008',  acquisitionDate: '2020-06-15', fuelType: 'Gas LP',    location: 'Pasillo 3',     critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0008', operatingHours: 9950,  statusSince: new Date().toISOString() },
  { id: 'DEMO-009', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-009',  acquisitionDate: '2020-06-15', fuelType: 'Gas LP',    location: 'Andén 2',      critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0009', operatingHours: 9700,  statusSince: new Date().toISOString() },
  { id: 'DEMO-010', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-010',  acquisitionDate: '2021-08-01', fuelType: 'Gas LP',    location: 'Pasillo 7',     critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0010', operatingHours: 7600,  statusSince: new Date().toISOString() },
  { id: 'DEMO-011', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-011',  acquisitionDate: '2021-08-01', fuelType: 'Gas LP',    location: 'Pasillo 8',     critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0011', operatingHours: 7550,  statusSince: new Date().toISOString() },
  { id: 'DEMO-012', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-012',  acquisitionDate: '2021-08-15', fuelType: 'Gas LP',    location: 'Andén 5',      critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0012', operatingHours: 7200,  statusSince: new Date().toISOString() },
  { id: 'DEMO-013', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-013',  acquisitionDate: '2021-09-01', fuelType: 'Gas LP',    location: 'Pasillo 9',     critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0013', operatingHours: 7100,  statusSince: new Date().toISOString() },
  { id: 'DEMO-014', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-014',  acquisitionDate: '2021-09-01', fuelType: 'Gas LP',    location: 'Pasillo 10',    critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0014', operatingHours: 6980,  statusSince: new Date().toISOString() },
  { id: 'DEMO-015', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-015',  acquisitionDate: '2021-09-15', fuelType: 'Gas LP',    location: 'Andén 4',      critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0015', operatingHours: 6750,  statusSince: new Date().toISOString() },
  { id: 'DEMO-016', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-016',  acquisitionDate: '2021-10-01', fuelType: 'Gas LP',    location: 'Patio Norte',   critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0016', operatingHours: 6200,  statusSince: new Date().toISOString() },
  { id: 'DEMO-017', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-017',  acquisitionDate: '2021-10-01', fuelType: 'Gas LP',    location: 'Patio Sur',     critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0017', operatingHours: 6300,  statusSince: new Date().toISOString() },
  { id: 'DEMO-018', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-018',  acquisitionDate: '2021-11-01', fuelType: 'Gas LP',    location: 'Pasillo 11',    critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0018', operatingHours: 5900,  statusSince: new Date().toISOString() },
  { id: 'DEMO-019', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-019',  acquisitionDate: '2021-11-01', fuelType: 'Gas LP',    location: 'Pasillo 12',    critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0019', operatingHours: 5850,  statusSince: new Date().toISOString() },
  { id: 'DEMO-020', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-020',  acquisitionDate: '2021-11-15', fuelType: 'Gas LP',    location: 'Andén 6',      critical: false, supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0020', operatingHours: 5700,  statusSince: new Date().toISOString() },
  { id: 'DEMO-021', brand: 'Toyota', model: '32-8FG30', serial: 'DEMO-SN-021',  acquisitionDate: '2017-01-15', fuelType: 'Gas LP',    location: 'Revisión Gral', critical: true,  supervisor: 'Supervisor Demo 1', sapCode: 'SAP-DEMO-0021', operatingHours: 22000, statusSince: new Date().toISOString() },
  { id: 'DEMO-BACKUP', brand: 'Toyota', model: '8FGU30',   serial: 'DEMO-SN-022',  acquisitionDate: '2016-06-01', fuelType: 'Gas LP',    location: 'Reserva',       critical: false, supervisor: 'Supervisor Demo 1', sapCode: '',           operatingHours: 25000, statusSince: new Date().toISOString() },
  { id: 'DEMO-RENTAL', brand: 'Toyota', model: '8FBCU30',  serial: 'DEMO-SN-023',  acquisitionDate: '2024-01-01', fuelType: 'Eléctrico', location: 'Patio Oriente',  critical: false, supervisor: 'Supervisor Demo 1', sapCode: '',           operatingHours: 1200,  statusSince: new Date().toISOString() },
];

/**
 * Hidrata los activos crudos con su estado inicial (Operativo por defecto).
 * data.service.ts llama a esta función y luego sincroniza con las fallas de Firebase.
 */
export function hydrateRealAssets(statuses: Status[]): Asset[] {
  const operativo = statuses.find(s => s.name === 'Operativo')!;

  return RAW_FLEET.map(a => ({
    ...a,
    status: operativo,
    cleanlinessStatus: 'Sanitized' as const,
    maintenanceTasks: []
  }));
}
