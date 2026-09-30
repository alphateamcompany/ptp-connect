import { InventoryView } from "@/components/inventory/inventory-view";
import {
  getInventory,
  getGeneratorOptions,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [items, generatorOptions] = await Promise.all([
    getInventory(),
    getGeneratorOptions(),
  ]);

  return (
    <InventoryView
      initialItems={items}
      generatorOptions={generatorOptions}
    />
  );
}
