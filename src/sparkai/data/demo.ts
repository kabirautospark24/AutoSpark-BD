import type { DemoVehicle, QuickAction } from '../types';
import { CATALOG_VEHICLES, filterCatalog, pickVehicles, vehiclePriceLabel, type VehicleFilter } from './catalog';

// ============================================================================
// Compatibility layer. The real inventory lives in data/catalog.ts and is
// derived from the sales KB (kb/sales.ts → official price sheet). These
// re-exports keep older imports/tests working.
// ============================================================================

/** Full chat-card inventory (102 offers across all 23 KB models). */
export const DEMO_VEHICLES: DemoVehicle[] = CATALOG_VEHICLES;

export const STARTER_ACTIONS: QuickAction[] = [
  { id: 'find', label: 'Find my ideal car', labelBn: 'আমার গাড়ি খুঁজুন', intent: 'find-car' },
  { id: 'explore', label: 'Explore Japanese cars', labelBn: 'জাপানি গাড়ি দেখুন', intent: 'explore' },
  { id: 'compare', label: 'Compare two vehicles', labelBn: 'তুলনা করুন', intent: 'compare' },
  { id: 'budget', label: 'Estimate my budget', labelBn: 'বাজেট হিসাব', intent: 'budget' },
  { id: 'preorder', label: 'Pre-order from Japan', labelBn: 'জাপান থেকে প্রি-অর্ডার', intent: 'preorder' },
  { id: 'service', label: 'Book a service', labelBn: 'সার্ভিস বুক করুন', intent: 'service' },
  { id: 'expert', label: 'Talk to an expert', labelBn: 'এক্সপার্টের সাথে কথা', intent: 'expert' },
];

export function filterDemoVehicles(f: VehicleFilter): DemoVehicle[] {
  return filterCatalog(f);
}

export { pickVehicles, vehiclePriceLabel };
export type { VehicleFilter };

export function formatBDT(amount: number): string {
  return '৳' + Math.round(amount).toLocaleString('en-IN');
}

export function formatLakh(lakh: number): string {
  return `৳${lakh.toFixed(1)} lakh`;
}
