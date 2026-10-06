import { FinanceView } from "@/components/finance/finance-view";
import {
  getInvoices,
  getPayments,
  getExpenses,
  getFinanceFormDataOptions,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [invoices, payments, expenses, formData] = await Promise.all([
    getInvoices(),
    getPayments(),
    getExpenses(),
    getFinanceFormDataOptions(),
  ]);

  return (
    <FinanceView
      initialInvoices={invoices}
      initialPayments={payments}
      initialExpenses={expenses}
      rentalOrders={formData.rentalOrders}
      customers={formData.customers}
      generators={formData.generators}
    />
  );
}
