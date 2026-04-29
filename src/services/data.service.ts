import { Injectable, signal, computed, effect } from '@angular/core';
import {
  Asset,
  FailureReport,
  Status,
  KPIData,
  ForkliftFailureEntry,
  MaintenanceTask,
  MaintenanceSchedule,
  EstadoRefaccion,
  AIInspectionResponse,
  RefurbishmentRecord
} from '../types';
import { firebaseApp, db as firestore } from '../firebase-init';
import {
  getDatabase,
  ref,
  onValue,
  set,
  update
} from 'firebase/database';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { hydrateRealAssets } from '../data/real-fleet';
import { environment } from '../environments/environment';

// Importaciones para Firebase Storage
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private app = firebaseApp;
  private db: ReturnType<typeof getDatabase> | null = null;
  private fs = firestore;
  private firebaseConfig = environment.firebase;

  // --- System State Signals ---
  readonly connectionStatus = signal<'online' | 'offline' | 'syncing'>('syncing');
  readonly lastUpdate = signal<Date>(new Date());
  readonly plantMode = signal<boolean>(false);
  readonly isKioskMode = signal<boolean>(false);
  readonly activeSlide = signal<number>(0);
  private kioskInterval: ReturnType<typeof setInterval> | null = null;

  // --- Master Catalogs ---
  readonly statuses: Status[] = [
    {
      id: '1',
      name: 'Operativo',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      hex: '#10b981'
    },
    { id: '2', name: 'Taller', color: 'bg-red-100 text-red-800 border-red-200', hex: '#ef4444' },
    {
      id: '3',
      name: 'Preventivo',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      hex: '#f59e0b'
    },
    { id: '4', name: 'Baja', color: 'bg-slate-100 text-slate-800 border-slate-200', hex: '#64748b' }
  ];

  // --- Business Data Signals ---
  private assetsSignal = signal<Asset[]>([]);
  private reportsSignal = signal<FailureReport[]>([]);
  readonly forkliftFailures = signal<ForkliftFailureEntry[]>([]);
  private workOrdersSignal = signal<any[]>([]);
  private refurbishmentsSignal = signal<RefurbishmentRecord[]>([]);

  // --- Public Read-Only Signals ---
  readonly assets = this.assetsSignal.asReadonly();
  readonly reports = this.reportsSignal.asReadonly();
  readonly workOrders = this.workOrdersSignal.asReadonly();
  readonly refurbishments = this.refurbishmentsSignal.asReadonly();

  // --- Computed KPIs ---
  readonly kpiData = computed<KPIData>(() => {
    const totalAssets = this.assetsSignal().length;
    const operativeAssets = this.assetsSignal().filter(a => a.status.name === 'Operativo').length;
    const closedReports = this.reportsSignal().filter(r => r.exitDate);
    let totalRepairHours = 0;
    closedReports.forEach(r => {
      const start = new Date(r.entryDate).getTime();
      const end = new Date(r.exitDate!).getTime();
      totalRepairHours += (end - start) / (1000 * 60 * 60);
    });
    const mttr = closedReports.length > 0 ? totalRepairHours / closedReports.length : 0;
    const currentMonth = new Date().getMonth();
    const monthlyCost = this.reportsSignal()
      .filter(r => new Date(r.entryDate).getMonth() === currentMonth)
      .reduce((acc, curr) => acc + curr.estimatedCost, 0);

    return {
      availability: totalAssets > 0 ? (operativeAssets / totalAssets) * 100 : 0,
      mttr: Math.round(mttr * 10) / 10,
      totalCostMonth: monthlyCost,
      budgetMonth: 18000
    };
  });

  readonly fleetAvailability = computed(() => {
    const allAssets = this.assetsSignal();
    if (allAssets.length === 0) return { percentage: 100, label: 'Excelente', color: '#10b981' };
    const operativeUnits = allAssets.filter(m => m.status.name === 'Operativo').length;
    const percentage = (operativeUnits / allAssets.length) * 100;
    return {
      percentage: Math.round(percentage),
      label: percentage >= 90 ? 'Excelente' : percentage >= 80 ? 'Regular' : 'Crítico',
      color: percentage >= 90 ? '#10b981' : percentage >= 80 ? '#f59e0b' : '#ef4444'
    };
  });

  readonly topOperators = computed(() => {
    const failures = this.forkliftFailures();
    const basePoints: { [key: string]: number } = {
      'Carlos Eduardo Vazquez Calderon': 100,
      'Juan Pablo Ortega': 100,
      'Ariel Alavez': 100
    };

    failures.forEach(f => {
      if (f.reporta && basePoints[f.reporta] !== undefined) {
        basePoints[f.reporta] -= 10; // Penalización por fallas reportadas (menos confiabilidad)
      }
    });

    return Object.entries(basePoints)
      .map(([name, points]) => ({ name, points: Math.max(0, points) }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
  });

  readonly safetyStats = signal({
    daysWithoutAccident: 142,
    record: 180,
    announcement: 'Uso obligatorio de EPP en Patio de Maniobras - Planta Cuautitlán'
  });

  readonly crewLeaderboard = signal([
    { rank: 1, name: 'Turno 1 (Matutino)', score: 98.5, pallets: 1450 },
    { rank: 2, name: 'Turno 2 (Vespertino)', score: 94.2, pallets: 1320 },
    { rank: 3, name: 'Turno 3 (Nocturno)', score: 89.8, pallets: 1105 }
  ]);

  private maintenanceScheduleSignal = signal<MaintenanceSchedule[]>([]);
  readonly maintenanceSchedule = this.maintenanceScheduleSignal.asReadonly();

  readonly complianceStats = computed(() => {
    const schedule = this.maintenanceSchedule();
    const total = schedule.length;
    const completed = schedule.filter(s => s.status === 'Completado').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  });

  constructor() {
    this.initFirebase();
    this.initializeData();

    effect(() => {
      this.syncAssetsWithFailures(this.forkliftFailures());
    });

    effect(() => {
      if (this.isKioskMode()) this.startKioskRotation();
      else this.stopKioskRotation();
    });

    window.addEventListener('online', () => this.updateConnectionStatus());
    window.addEventListener('offline', () => this.updateConnectionStatus());
  }

  /**
   * Sube una imagen a Firebase Storage y guarda la URL en Firestore junto con los datos del activo.
   * @param file Archivo de imagen a subir
   * @param assetData Datos del activo a guardar junto con la imagen
   */
  async uploadAssetImage(file: File, assetData: any) {
    const storage = getStorage();
    const fileRef = storageRef(storage, `assets/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    // Guarda la URL en Firestore junto con los datos del activo
    await addDoc(collection(this.fs, 'assets'), {
      ...assetData,
      imageUrl: url,
      createdAt: new Date()
    });
    return url;
  }

  private initializeData() {
    const assets = this.loadRealFleet();
    this.assetsSignal.set(assets);
    const reports = this.generateRealReports();
    this.reportsSignal.set(reports);
    const failures = this.generateRealLiveFailures().map(f => ({
      ...f,
      sla: f.sla || {},
      fechaEstimadaLlegada: f.fechaEstimadaLlegada || '',
      refacciones: f.refacciones || []
    }));
    this.forkliftFailures.set(failures);
    this.maintenanceScheduleSignal.set(this.generateMaintenanceSchedule());
    this.refreshWorkOrders();
  }

  private refreshWorkOrders() {
    const failures = this.forkliftFailures();
    const schedule = this.maintenanceSchedule();

    const woFromFailures = failures.map(f => ({
      id: f.id.replace('FAIL-', '').substring(0, 4),
      titulo: f.falla.substring(0, 40) + (f.falla.length > 40 ? '...' : ''),
      descripcion: f.falla,
      unidad: f.economico,
      tecnico: 'Sin Asignar', // O mapear si hay seguimiento
      prioridad: f.prioridad,
      tipo: 'Correctivo',
      estatus: f.estatus === 'Abierta' ? 'pending' : f.estatus === 'En Proceso' ? 'progress' : 'completed',
      fecha: new Date(f.fechaIngreso)
    }));

    const woFromSchedule = schedule.filter(s => s.status !== 'Completado').map(s => ({
      id: s.otFolio.replace('MXOT', ''),
      titulo: `Mantenimiento SMP ${s.smpType}`,
      descripcion: `Servicio programado tipo ${s.smpType} para unidad ${s.economico}`,
      unidad: s.economico,
      tecnico: s.technician,
      prioridad: 'Media',
      tipo: 'Preventivo',
      estatus: s.status === 'Programado' ? 'pending' : 'progress',
      fecha: new Date(s.scheduledDate)
    }));

    this.workOrdersSignal.set([...woFromFailures, ...woFromSchedule]);
  }

  private initFirebase() {
    try {
      if (!this.firebaseConfig.apiKey || !this.firebaseConfig.databaseURL || !this.firebaseConfig.projectId) {
        console.warn('Firebase configuration incomplete. Running in offline mode.');
        this.connectionStatus.set('offline');
        return;
      }
      this.db = getDatabase(this.app);
      const connectedRef = ref(this.db!, '.info/connected');
      onValue(connectedRef, snap => {
        if (snap.val() === true) {
          this.connectionStatus.set('online');
        } else {
          this.connectionStatus.set('offline');
        }
      });
      this.setupListeners();
    } catch (e) {
      console.error('Firebase init error:', e);
      this.connectionStatus.set('offline');
    }
  }

  private updateConnectionStatus() {
    this.connectionStatus.set(navigator.onLine ? 'online' : 'offline');
  }

  private setupListeners() {
    if (!this.db) return;
    const failuresRef = ref(this.db, 'failures');
    onValue(failuresRef, snapshot => {
      const data = snapshot.val();
      this.lastUpdate.set(new Date());
      if (data) {
        const list = Object.values(data) as ForkliftFailureEntry[];
        list.sort((a, b) => new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime());
        this.forkliftFailures.set(list);
        this.syncAssetsWithFailures(list);
        this.refreshWorkOrders();
      } else {
        this.seedDatabase();
      }
    });

    const kioskRef = ref(this.db!, 'settings/kioskMode');
    onValue(kioskRef, snapshot => {
      const val = snapshot.val();
      if (val !== null && this.isKioskMode() !== val) this.isKioskMode.set(val);
    });

    const refurbRef = ref(this.db!, 'refurbishments');
    onValue(refurbRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data) as RefurbishmentRecord[];
        list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        this.refurbishmentsSignal.set(list);
      }
    });
  }

  private seedDatabase() {
    if (!this.db) return;
    const updates: any = {};
    const initialFailures = this.forkliftFailures();
    initialFailures.forEach(f => {
      updates['failures/' + f.id] = f;
    });
    updates['settings/kioskMode'] = false;
    update(ref(this.db!), updates).catch(() => {});
  }

  toggleKioskMode() {
    if (!this.db) return;
    const newValue = !this.isKioskMode();
    this.isKioskMode.set(newValue);
    if (this.connectionStatus() === 'online') {
      set(ref(this.db!, 'settings/kioskMode'), newValue).catch(() => {});
    }
  }

  private startKioskRotation() {
    if (this.kioskInterval) clearInterval(this.kioskInterval);
    this.kioskInterval = setInterval(() => {
      this.activeSlide.update(current => (current + 1) % 3);
    }, 15000);
  }

  private stopKioskRotation() {
    if (this.kioskInterval) clearInterval(this.kioskInterval);
    this.activeSlide.set(0);
  }

  togglePlantMode() {
    this.plantMode.update(v => !v);
  }

  getAsset(id: string): Asset | undefined {
    return this.assetsSignal().find(a => a.id === id);
  }

  getAssetHistory(assetId: string): FailureReport[] {
    return this.reportsSignal()
      .filter(r => r.assetId === assetId)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }

  addLiveFailure(entry: Omit<ForkliftFailureEntry, 'id' | 'fechaIngreso' | 'seguimiento'>) {
    const newEntry: ForkliftFailureEntry = {
      ...entry,
      id: 'F-' + Date.now(),
      fechaIngreso: new Date().toISOString(),
      seguimiento: []
    };
    const wasOffline = this.connectionStatus() === 'offline';
    this.connectionStatus.set('syncing');
    this.forkliftFailures.update(list => [newEntry, ...list]);
    this.syncAssetsWithFailures(this.forkliftFailures());
    if (!wasOffline && this.db) {
      set(ref(this.db!, 'failures/' + newEntry.id), newEntry)
        .then(() => this.connectionStatus.set('online'))
        .catch(() => this.connectionStatus.set('offline'));
    }
  }

  addFailureUpdate(failureId: string, message: string, user: string) {
    const failure = this.forkliftFailures().find(f => f.id === failureId);
    if (!failure) return;
    const updatedFailure = {
      ...failure,
      estatus: 'En Proceso' as const,
      seguimiento: [
        ...failure.seguimiento,
        { usuario: user, mensaje: message, fecha: new Date().toISOString() }
      ]
    };
    this.forkliftFailures.update(list => list.map(f => (f.id === failureId ? updatedFailure : f)));
    if (this.connectionStatus() !== 'offline' && this.db) {
      update(ref(this.db!, 'failures/' + failureId), updatedFailure).catch(console.error);
    }
  }

  updateToyotaLogistics(failureId: string, po: string, statusRef: ForkliftFailureEntry['estatusRefaccion'], promiseDate?: string) {
    const updates: Partial<ForkliftFailureEntry> = {
      ordenCompra: po,
      estatusRefaccion: statusRef,
      fechaPromesa: promiseDate,
      estatus: 'En Proceso'
    };
    this.forkliftFailures.update(list => list.map(f => (f.id === failureId ? { ...f, ...updates } : f)));
    if (this.connectionStatus() !== 'offline' && this.db) {
      update(ref(this.db!, 'failures/' + failureId), updates).catch(console.error);
    }
  }

  closeLiveFailure(id: string) {
    const failure = this.forkliftFailures().find(f => f.id === id);
    if (!failure) return;
    const updatedFailure = {
      ...failure,
      estatus: 'Cerrada' as const,
      fechaSalida: new Date().toISOString()
    };
    this.forkliftFailures.update(list => list.map(f => (f.id === id ? updatedFailure : f)));
    this.syncAssetsWithFailures(this.forkliftFailures());
    if (this.connectionStatus() !== 'offline' && this.db) {
      update(ref(this.db!, 'failures/' + id), updatedFailure).catch(console.error);
    }
  }

  // --- Refurbishment Methods ---
  addRefurbishment(record: Omit<RefurbishmentRecord, 'id' | 'startDate'>) {
    const newRecord: RefurbishmentRecord = {
      ...record,
      id: 'REF-' + Date.now(),
      startDate: new Date().toISOString()
    };
    this.refurbishmentsSignal.update(list => [newRecord, ...list]);
    if (this.db) {
      set(ref(this.db, 'refurbishments/' + newRecord.id), newRecord).catch(console.error);
    }
  }

  updateRefurbishment(id: string, updates: Partial<RefurbishmentRecord>) {
    this.refurbishmentsSignal.update(list =>
      list.map(r => r.id === id ? { ...r, ...updates } : r)
    );
    if (this.db) {
      update(ref(this.db, 'refurbishments/' + id), updates).catch(console.error);
    }
  }

  finishRefurbishment(id: string, finalPhoto: string) {
    const refurb = this.refurbishmentsSignal().find(r => r.id === id);
    if (!refurb) return;

    const updates = {
      status: 'Finalizado' as const,
      completionPercentage: 100,
      endDate: new Date().toISOString(),
      photos: {
        ...refurb.photos,
        after: [...refurb.photos.after, finalPhoto]
      }
    };
    this.updateRefurbishment(id, updates);
  }

  // --- AI History Persistence (Firestore) ---
  async saveAIResult(assetId: string, type: string, result: any) {
    try {
      const aiRef = collection(this.fs, 'ai_history');
      await addDoc(aiRef, {
        assetId,
        type,
        result,
        timestamp: new Date().toISOString(),
        user: 'system'
      });
    } catch (err) {
      console.error('Error saving AI result:', err);
    }
  }

  async getAIHistory(assetId: string, type?: string) {
    try {
      const aiRef = collection(this.fs, 'ai_history');
      let q = query(aiRef, where('assetId', '==', assetId), orderBy('timestamp', 'desc'), limit(10));
      if (type) {
        q = query(aiRef, where('assetId', '==', assetId), where('type', '==', type), orderBy('timestamp', 'desc'), limit(5));
      }
      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data());
    } catch (err) {
      console.error('Error fetching AI history:', err);
      return [];
    }
  }

  reportFailure(assetId: string, description: string) {
    this.addLiveFailure({
      economico: assetId,
      falla: description,
      prioridad: 'Media',
      reporta: 'Operador (App)',
      estatus: 'Abierta'
    });
  }

  private syncAssetsWithFailures(failures: ForkliftFailureEntry[]) {
    const activeFailures = failures.filter(f => f.estatus !== 'Cerrada');
    const activeIds = new Set(activeFailures.map(f => f.economico));
    const activeFailureMap = new Map(activeFailures.map(f => [f.economico, f]));
    const tallerStatus = this.statuses.find(s => s.name === 'Taller')!;
    const opStatus = this.statuses.find(s => s.name === 'Operativo')!;

    this.assetsSignal.update(assets =>
      assets.map(a => {
        if (activeIds.has(a.id)) {
          return {
            ...a,
            status: tallerStatus,
            statusSince: activeFailureMap.get(a.id)?.fechaIngreso || new Date().toISOString(),
            lastFailure: activeFailureMap.get(a.id)?.falla
          };
        } else if (a.status.name === 'Taller') {
          return {
            ...a,
            status: opStatus,
            statusSince: new Date().toISOString(),
            lastFailure: undefined
          };
        }
        return a;
      })
    );
  }

  private loadRealFleet(): Asset[] {
    const realAssets = hydrateRealAssets(this.statuses);
    return realAssets;
  }

  private generateRealReports(): FailureReport[] {
    const assets = this.assetsSignal();
    if (assets.length === 0) return [];

    // Generar un historial ficticio pero coherente para los primeros 5 activos
    const history: FailureReport[] = [];
    const technicians = ['Maycol Martinez', 'Ariel Alavez', 'Erick Ramon'];
    const issues = ['Mantenimiento Preventivo', 'Fuga Hidráulica', 'Falla Eléctrica', 'Desgaste de Llantas'];

    assets.slice(0, 5).forEach((asset, idx) => {
      const entryDate = new Date();
      entryDate.setDate(entryDate.getDate() - (idx + 5));

      const exitDate = new Date(entryDate);
      exitDate.setHours(exitDate.getHours() + 4);

      history.push({
        id: `REP-${idx}`,
        assetId: asset.id,
        entryDate: entryDate.toISOString(),
        exitDate: exitDate.toISOString(),
        failureDescription: issues[idx % issues.length],
        type: 'Mecánico', // Default type for real history
        technician: technicians[idx % technicians.length],
        partsUsed: [],
        estimatedCost: 1200 + (idx * 150),
      });
    });

    return history;
  }

  private generateRealLiveFailures(): ForkliftFailureEntry[] {
    return [
      {
        id: 'FAIL-2026-0001',
        economico: '35526',
        falla: 'Fuga de aceite hidráulico en cilindro de elevación principal.',
        reporta: 'Carlos Eduardo Vazquez Calderon',
        fechaIngreso: new Date().toISOString(),
        prioridad: 'Alta',
        estatus: 'Abierta',
        seguimiento: [],
        estatusRefaccion: EstadoRefaccion.NO_APLICA
      }
    ];
  }

  private evaluateStatus(date: string): 'Programado' | 'Vencido' | 'Completado' {
    const today = new Date();
    const scheduledDate = new Date(date);
    if (scheduledDate < today) return 'Vencido';
    return 'Programado';
  }

  private generateMaintenanceSchedule(): MaintenanceSchedule[] {
    const staticData = [
      { model: "32-8FG30", serial: "66454", eco: "CUA-29440", smp: "REV", date: "2026-02-05", tech: "Maycol Martinez", ot: "MXOT184286" },
      { model: "32-8FG30", serial: "92719", eco: "CUA-35526", smp: "Z", date: "2026-02-14", tech: "Ariel Alavez", ot: "MXOT184289" },
      { model: "32-8FG30", serial: "92714", eco: "CUA-35482", smp: "X", date: "2026-02-05", tech: "Max Gonzalo", ot: "MXOT184291" },
      { model: "32-8FG30", serial: "92730", eco: "CUA-35483", smp: "X", date: "2026-02-05", tech: "Ariel Alavez", ot: "MXOT184293" },
      { model: "32-8FG30", serial: "92732", eco: "CUA-35494", smp: "X", date: "2026-02-08", tech: "Erick Ramon", ot: "MXOT184294" },
      { model: "32-8FG30", serial: "95159", eco: "CUA-37191", smp: "X", date: "2026-02-07", tech: "Maycol Martinez", ot: "MXOT184296" },
      { model: "32-8FG30", serial: "95162", eco: "CUA-37192", smp: "X", date: "2026-02-07", tech: "Ariel Alavez", ot: "MXOT184297" },
      { model: "32-8FG30", serial: "95074", eco: "CUA-37193", smp: "X", date: "2026-02-07", tech: "Max Gonzalo", ot: "MXOT184298" },
      { model: "32-8FG30", serial: "95056", eco: "CUA-37194", smp: "X", date: "2026-02-08", tech: "Erick Ramon", ot: "MXOT184299" },
      { model: "32-8FG30", serial: "95049", eco: "CUA-37195", smp: "X", date: "2026-02-08", tech: "Ariel Alavez", ot: "MXOT184300" },
      { model: "32-8FG30", serial: "97520", eco: "CUA-40019", smp: "REV", date: "2026-02-12", tech: "Max Gonzalo", ot: "MXOT184303" },
      { model: "32-8FG30", serial: "97519", eco: "CUA-40020", smp: "Y", date: "2026-02-12", tech: "Ariel Alavez", ot: "MXOT184304" },
      { model: "32-8FG30", serial: "97532", eco: "CUA-40021", smp: "Y", date: "2026-02-11", tech: "Erick Ramon", ot: "MXOT184307" },
      { model: "32-8FG30", serial: "97518", eco: "CUA-40057", smp: "Y", date: "2026-02-07", tech: "Maycol Martinez", ot: "MXOT184310" },
      { model: "32-8FG30", serial: "97529", eco: "CUA-40060", smp: "Y", date: "2026-02-07", tech: "Ariel Alavez", ot: "MXOT184313" },
      { model: "32-8FG30", serial: "97560", eco: "CUA-40065", smp: "REV", date: "2026-02-09", tech: "Max Gonzalo", ot: "MXOT184314" },
      { model: "32-8FG30", serial: "97562", eco: "CUA-40327", smp: "REV", date: "2026-02-09", tech: "Erick Ramon", ot: "MXOT184315" },
      { model: "32-8FG30", serial: "97584", eco: "CUA-40328", smp: "REV", date: "2026-02-09", tech: "Ariel Alavez", ot: "MXOT184318" },
      { model: "32-8FG30", serial: "97781", eco: "CUA-40338", smp: "Z", date: "2026-02-14", tech: "Maycol Martinez", ot: "MXOT184321" },
      { model: "32-8FG30", serial: "97788", eco: "CUA-40066", smp: "X", date: "2026-02-10", tech: "Erick Ramon", ot: "MXOT184322" },
      { model: "32-8FG30", serial: "97796", eco: "CUA-40067", smp: "REV", date: "2026-02-14", tech: "Ariel Alavez", ot: "MXOT184324" },
      { model: "8FGU30", serial: "35540", eco: "BACK-UP", smp: "REV", date: "2026-02-12", tech: "Maycol Martinez", ot: "MXOT184326" },
      { model: "8FBCU30", serial: "67022", eco: "RENTA", smp: "REV", date: "2026-02-05", tech: "Erick Ramon", ot: "MXOT184327" }
    ];

    return staticData.map((item, index) => {
      const scheduledIso = new Date(item.date).toISOString();
      const status = this.evaluateStatus(scheduledIso);
      return {
        id: `SCH-${index}`,
        model: item.model,
        serial: item.serial,
        economico: item.eco,
        supervisor: "AARON VELAZQUEZ",
        smpType: item.smp as any,
        scheduledDate: scheduledIso,
        realDate: undefined,
        duration: "2hrs",
        otFolio: item.ot,
        serviceOrder: `OS-${237000 + index}`,
        hourMeter: undefined,
        technician: item.tech,
        status: status,
        history: [],
        comments: ''
      };
    });
  }

  async updateMaintenanceDate(id: string, newDate: string) {
    this.maintenanceScheduleSignal.update(list => list.map(item => {
      if (item.id === id) {
        return { ...item, realDate: newDate, status: 'Completado' };
      }
      return item;
    }));
    this.refreshWorkOrders();
  }

  async updateMaintenanceComments(id: string, comments: string) {
    this.maintenanceScheduleSignal.update(list => list.map(item => {
      if (item.id === id) {
        return { ...item, comments };
      }
      return item;
    }));
  }

  async updateMaintenanceScheduleFromExcel(data: any[]) {
    let success = 0;
    let errors: string[] = [];

    this.maintenanceScheduleSignal.update(list => {
      const newList = [...list];
      data.forEach((row, idx) => {
        try {
          const eco = row['Economico'] || row['economico'] || row['ECONOMICO'] || row['Unidad'];
          if (eco) {
            const existingIdx = newList.findIndex(item => item.economico === eco);
            if (existingIdx >= 0) {
              // Basic mapping for demo purposes
              newList[existingIdx] = {
                ...newList[existingIdx],
                realDate: row['Fecha Real'] || newList[existingIdx].realDate,
                technician: row['Técnico Real'] || row['Tecnico Real'] || newList[existingIdx].technician,
                hourMeter: row['Horómetro'] || row['Horometro'] || newList[existingIdx].hourMeter,
                status: row['Fecha Real'] ? 'Completado' : newList[existingIdx].status
              } as any;
              success++;
            } else {
              errors.push(`Unidad ${eco} no encontrada en el programa base.`);
            }
          }
        } catch (e) {
          errors.push(`Error en fila ${idx + 2}`);
        }
      });
      return newList;
    });

    this.refreshWorkOrders();
    return { success, errors };
  }

  // --- Excel Bulk Updates ---
  async updateAssetsFromExcel(data: any[]) {
    this.assetsSignal.update(current => {
      let updated = [...current];
      data.forEach(row => {
        const eco = row['Economico'] || row['economico'] || row['ID'];
        if (eco) {
          const idx = updated.findIndex(a => a.id === eco);
          if (idx !== -1) {
             updated[idx] = {
               ...updated[idx],
               brand: row['Marca'] || updated[idx].brand,
               model: row['Modelo'] || updated[idx].model,
               serial: row['Serie'] || updated[idx].serial,
               status: {
                 name: row['Estatus'] || updated[idx].status.name,
                 color: row['Estatus'] === 'Operativo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
               } as any
             };
          }
        }
      });
      return updated;
    });
  }
}
