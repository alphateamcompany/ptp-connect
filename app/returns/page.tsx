import {
  getReturns,
  getRentalOrdersForReturn,
  getNextReturnNumber,
} from "./actions";
import { ReturnsView } from "@/components/returns/returns-view";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
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
