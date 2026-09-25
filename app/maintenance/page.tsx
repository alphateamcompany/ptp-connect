import {
  getMaintenanceRecords,
  getMaintenanceStats,
  getGeneratorsForMaintenance,
} from "./actions";
import { MaintenanceView } from "@/components/maintenance/maintenance-view";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const [recordsRes, stats, generators] = await Promise.all([
    getMaintenanceRecords(),
    getMaintenanceStats(),
    getGeneratorsForMaintenance(),
  ]);

  const initialRecords =
    recordsRes.success && recordsRes.data ? recordsRes.data : [];

  return (
    <MaintenanceView
      initialRecords={initialRecords}
      generators={generators}
      stats={stats}
    />
  );
}
