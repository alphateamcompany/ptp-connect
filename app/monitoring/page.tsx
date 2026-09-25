import { getSiteLogs, getRentalOrdersForMonitoring } from "./actions";
import { MonitoringView } from "@/components/monitoring/monitoring-view";

export const dynamic = "force-dynamic";

export default async function MonitoringPage() {
  const [logsRes, ordersRes] = await Promise.all([
    getSiteLogs(),
    getRentalOrdersForMonitoring(),
  ]);

  const initialLogs = logsRes.success && logsRes.data ? logsRes.data : [];
  const rentalOrders = ordersRes.success && ordersRes.data ? ordersRes.data : [];

  return (
    <MonitoringView
      initialLogs={initialLogs}
      rentalOrders={rentalOrders}
    />
  );
}
