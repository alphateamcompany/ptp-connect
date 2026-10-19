import {
  getReturns,
  getRentalOrdersForReturn,
  getNextReturnNumber,
} from "@/app/returns/actions";
import { ReturnsView } from "@/components/returns/returns-view";

export const dynamic = "force-dynamic";

export default async function TransportPage() {
  const [returnsRes, rentalOrders, nextReturnNumber] = await Promise.all([
    getReturns(),
    getRentalOrdersForReturn(),
    getNextReturnNumber(),
  ]);

  const initialReturns = Array.isArray(returnsRes) ? returnsRes : [];

  return (
    <ReturnsView
      initialReturns={initialReturns}
      rentalOrders={rentalOrders}
      nextReturnNumber={nextReturnNumber}
    />
  );
}
