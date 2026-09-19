import { getCustomers } from "./actions";
import { CustomersView } from "@/components/customers/customers-view";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const result = await getCustomers();
  const initialCustomers = result.success && result.data ? result.data : [];

  return <CustomersView initialCustomers={initialCustomers} />;
}
