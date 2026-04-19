// =======================================================================================
// real-fleet.ts — AssetGuard Corporate Edition Advanced
// Datos reales de la flota de montacargas de la Planta Cuautitlán.
// Fuente: Programa SMP Toyota — Febrero 2026
// =======================================================================================

import { Asset, Status } from '../types';

const RAW_FLEET: Omit<Asset, 'status' | 'cleanlinessStatus'>[] = [
  { id: 'CUA-35526', brand: 'Toyota', model: '32-8FG30', serial: '92719',  acquisitionDate: '2019-03-01', fuelType: 'Gas LP',    location: 'Pasillo 4',     critical: true,  supervisor: 'AARON VELAZQUEZ', sapCode: '1000035526', operatingHours: 14200, statusSince: new Date().toISOString() },
  { id: 'CUA-35482', brand: 'Toyota', model: '32-8FG30', serial: '92714',  acquisitionDate: '2019-03-01', fuelType: 'Gas LP',    location: 'Pasillo 2',     critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000035482', operatingHours: 13850, statusSince: new Date().toISOString() },
  { id: 'CUA-35483', brand: 'Toyota', model: '32-8FG30', serial: '92730',  acquisitionDate: '2019-03-01', fuelType: 'Gas LP',    location: 'Andén 3',      critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000035483', operatingHours: 13900, statusSince: new Date().toISOString() },
  { id: 'CUA-35494', brand: 'Toyota', model: '32-8FG30', serial: '92732',  acquisitionDate: '2019-04-01', fuelType: 'Gas LP',    location: 'Pasillo 1',     critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000035494', operatingHours: 12400, statusSince: new Date().toISOString() },
  { id: 'CUA-37191', brand: 'Toyota', model: '32-8FG30', serial: '95159',  acquisitionDate: '2020-06-01', fuelType: 'Gas LP',    location: 'Pasillo 5',     critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000037191', operatingHours: 10200, statusSince: new Date().toISOString() },
  { id: 'CUA-37192', brand: 'Toyota', model: '32-8FG30', serial: '95162',  acquisitionDate: '2020-06-01', fuelType: 'Gas LP',    location: 'Andén 1',      critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000037192', operatingHours: 10100, statusSince: new Date().toISOString() },
  { id: 'CUA-37193', brand: 'Toyota', model: '32-8FG30', serial: '95074',  acquisitionDate: '2020-06-01', fuelType: 'Gas LP',    location: 'Pasillo 6',     critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000037193', operatingHours: 9800,  statusSince: new Date().toISOString() },
  { id: 'CUA-37194', brand: 'Toyota', model: '32-8FG30', serial: '95056',  acquisitionDate: '2020-06-15', fuelType: 'Gas LP',    location: 'Pasillo 3',     critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000037194', operatingHours: 9950,  statusSince: new Date().toISOString() },
  { id: 'CUA-37195', brand: 'Toyota', model: '32-8FG30', serial: '95049',  acquisitionDate: '2020-06-15', fuelType: 'Gas LP',    location: 'Andén 2',      critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000037195', operatingHours: 9700,  statusSince: new Date().toISOString() },
  { id: 'CUA-40019', brand: 'Toyota', model: '32-8FG30', serial: '97520',  acquisitionDate: '2021-08-01', fuelType: 'Gas LP',    location: 'Pasillo 7',     critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040019', operatingHours: 7600,  statusSince: new Date().toISOString() },
  { id: 'CUA-40020', brand: 'Toyota', model: '32-8FG30', serial: '97519',  acquisitionDate: '2021-08-01', fuelType: 'Gas LP',    location: 'Pasillo 8',     critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040020', operatingHours: 7550,  statusSince: new Date().toISOString() },
  { id: 'CUA-40021', brand: 'Toyota', model: '32-8FG30', serial: '97532',  acquisitionDate: '2021-08-15', fuelType: 'Gas LP',    location: 'Andén 5',      critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040021', operatingHours: 7200,  statusSince: new Date().toISOString() },
  { id: 'CUA-40057', brand: 'Toyota', model: '32-8FG30', serial: '97518',  acquisitionDate: '2021-09-01', fuelType: 'Gas LP',    location: 'Pasillo 9',     critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040057', operatingHours: 7100,  statusSince: new Date().toISOString() },
  { id: 'CUA-40060', brand: 'Toyota', model: '32-8FG30', serial: '97529',  acquisitionDate: '2021-09-01', fuelType: 'Gas LP',    location: 'Pasillo 10',    critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040060', operatingHours: 6980,  statusSince: new Date().toISOString() },
  { id: 'CUA-40065', brand: 'Toyota', model: '32-8FG30', serial: '97560',  acquisitionDate: '2021-09-15', fuelType: 'Gas LP',    location: 'Andén 4',      critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040065', operatingHours: 6750,  statusSince: new Date().toISOString() },
  { id: 'CUA-40327', brand: 'Toyota', model: '32-8FG30', serial: '97562',  acquisitionDate: '2021-10-01', fuelType: 'Gas LP',    location: 'Patio Norte',   critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040327', operatingHours: 6200,  statusSince: new Date().toISOString() },
  { id: 'CUA-40328', brand: 'Toyota', model: '32-8FG30', serial: '97584',  acquisitionDate: '2021-10-01', fuelType: 'Gas LP',    location: 'Patio Sur',     critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040328', operatingHours: 6300,  statusSince: new Date().toISOString() },
  { id: 'CUA-40338', brand: 'Toyota', model: '32-8FG30', serial: '97781',  acquisitionDate: '2021-11-01', fuelType: 'Gas LP',    location: 'Pasillo 11',    critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040338', operatingHours: 5900,  statusSince: new Date().toISOString() },
  { id: 'CUA-40066', brand: 'Toyota', model: '32-8FG30', serial: '97788',  acquisitionDate: '2021-11-01', fuelType: 'Gas LP',    location: 'Pasillo 12',    critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040066', operatingHours: 5850,  statusSince: new Date().toISOString() },
  { id: 'CUA-40067', brand: 'Toyota', model: '32-8FG30', serial: '97796',  acquisitionDate: '2021-11-15', fuelType: 'Gas LP',    location: 'Andén 6',      critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '1000040067', operatingHours: 5700,  statusSince: new Date().toISOString() },
  { id: 'CUA-29440', brand: 'Toyota', model: '32-8FG30', serial: '66454',  acquisitionDate: '2017-01-15', fuelType: 'Gas LP',    location: 'Revisión Gral', critical: true,  supervisor: 'AARON VELAZQUEZ', sapCode: '1000029440', operatingHours: 22000, statusSince: new Date().toISOString() },
  { id: 'BACK-UP',   brand: 'Toyota', model: '8FGU30',   serial: '35540',  acquisitionDate: '2016-06-01', fuelType: 'Gas LP',    location: 'Reserva',       critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '',           operatingHours: 25000, statusSince: new Date().toISOString() },
  { id: 'RENTA',     brand: 'Toyota', model: '8FBCU30',  serial: '67022',  acquisitionDate: '2024-01-01', fuelType: 'Eléctrico', location: 'Patio Oriente',  critical: false, supervisor: 'AARON VELAZQUEZ', sapCode: '',           operatingHours: 1200,  statusSince: new Date().toISOString() },
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
