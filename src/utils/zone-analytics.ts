import { Asset, ForkliftFailureEntry, ZoneSummary } from '../types';

export function computeZoneAnalytics(
  assets: Asset[],
  failures: ForkliftFailureEntry[]
): ZoneSummary[] {
  const activeFailures = failures.filter((f) => f.estatus !== 'Cerrada');
  const zoneMap = new Map<string, Asset[]>();

  for (const asset of assets) {
    const zoneName = (asset.location || 'Sin Zona').trim();
    const list = zoneMap.get(zoneName) || [];
    list.push(asset);
    zoneMap.set(zoneName, list);
  }

  const summaries: ZoneSummary[] = [];

  for (const [zone, zoneAssets] of zoneMap.entries()) {
    const totalAssets = zoneAssets.length;
    const operativeCount = zoneAssets.filter((a) => a.status.name === 'Operativo').length;
    const tallerCount = zoneAssets.filter((a) => a.status.name === 'Taller').length;
    const preventiveCount = zoneAssets.filter((a) => a.status.name === 'Preventivo').length;
    const criticalAssetsCount = zoneAssets.filter((a) => a.critical).length;

    const zoneAssetIds = new Set(zoneAssets.map((a) => a.id));
    const activeFailuresCount = activeFailures.filter((f) => zoneAssetIds.has(f.economico)).length;

    const availabilityPct = totalAssets > 0 ? Math.round((operativeCount / totalAssets) * 100) : 100;

    const haccpSanitizedCount = zoneAssets.filter((a) => a.cleanlinessStatus === 'Sanitized').length;
    const haccpPendingCount = zoneAssets.filter((a) => a.cleanlinessStatus === 'Pending').length;
    const haccpCriticalCount = zoneAssets.filter((a) => a.cleanlinessStatus === 'Critical').length;
    const haccpCompliancePct =
      totalAssets > 0 ? Math.round((haccpSanitizedCount / totalAssets) * 100) : 100;

    summaries.push({
      zone,
      totalAssets,
      operativeCount,
      tallerCount,
      preventiveCount,
      criticalAssetsCount,
      activeFailuresCount,
      availabilityPct,
      haccpSanitizedCount,
      haccpPendingCount,
      haccpCriticalCount,
      haccpCompliancePct,
      assets: zoneAssets,
    });
  }

  return summaries.sort((a, b) => {
    if (b.activeFailuresCount !== a.activeFailuresCount) {
      return b.activeFailuresCount - a.activeFailuresCount;
    }
    return a.availabilityPct - b.availabilityPct;
  });
}
