import { getRentalOrders, getFormDataOptions } from "./actions";
import { RentalsView } from "@/components/rentals/rentals-view";

export const dynamic = "force-dynamic";

export default async function RentalsPage() {
  const [ordersRes, options] = await Promise.all([
    getRentalOrders(),
    getFormDataOptions(),
  ]);

  const initialOrders = ordersRes.success && ordersRes.data ? ordersRes.data : [];

  return (
    <RentalsView
      initialOrders={initialOrders}
      customers={options.customers}
      generators={options.generators}
    />
  );
}
