import { getDispatches, getRentalOrdersForDispatch } from "./actions";
import { DispatchView } from "@/components/dispatch/dispatch-view";

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  const [dispatchesRes, ordersRes] = await Promise.all([
    getDispatches(),
    getRentalOrdersForDispatch(),
  ]);

  const initialDispatches =
    dispatchesRes.success && dispatchesRes.data ? dispatchesRes.data : [];
  const rentalOrders =
    ordersRes.success && ordersRes.data ? ordersRes.data : [];

  return (
    <DispatchView
      initialDispatches={initialDispatches}
      rentalOrders={rentalOrders}
    />
  );
}
