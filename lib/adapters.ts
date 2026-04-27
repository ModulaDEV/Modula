/**
 * API → UI shape adapter.
 *
 * The legacy Registry components were built around a hand-shaped
 * RegistryModel (data/models.ts). The read API returns the canonical
 * ModelDto. This single adapter is the bridge so the components
 * don't have to know about the API schema.
 *
 * Keeping the bridge in one place means component code stays small
 * and the API → UI contract is testable in isolation.
 */
import type { ModelDto } from "./api";
import type { RegistryModel } from "@/data/models";
import {
  shortHex,
  formatCount,
  formatPrice,
  curveMultiplier,
  trendToNumbers,
} from "./format";

/**
 * Map an ModelDto into the legacy RegistryModel display shape so
 * existing render code (Registry section + /registry page) works
 * unchanged.
 *
 * `type` is best-effort — if `model_type` doesn't match one of the
 * known display labels we fall back to "Domain Expert" so the chip
 * still renders.
 */
export function toRegistryModel(d: ModelDto): RegistryModel {
  const type: RegistryModel["type"] = pickType(d.model_type);
  const trend = trendToNumbers(d.trend ?? []);
  // No basePremium server-side yet — curve_ticks doesn't carry it.
  // For now compute mult from first vs last trend point as an
  // approximation; once the indexer reads asset.basePremium this
  // gets replaced with a precise computation in lib/format.ts.
  const mult =
    trend.length >= 2 && trend[0] && trend[0] > 0
      ? `${(trend[trend.length - 1]! / trend[0]).toFixed(1)}×`
      : curveMultiplier(d.latest_price_usdc, null) ?? "—";

  return {
    id:              shortHex(d.id),
    name:            d.slug,
    type,
    base:            d.base_model ?? "—",
    calls:           formatCount(d.calls),
    price:           formatPrice(d.latest_price_usdc),
    trend:           trend.length > 0 ? trend : [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    curveMultiplier: mult,
  };
}

function pickType(modelType: string | null): RegistryModel["type"] {
  switch (modelType) {
    case "LoRA":             return "LoRA";
    case "Adapter":          return "Adapter";
    case "Small":
    case "Small Specialized":return "Small Specialized";
    case "DomainExpert":
    case "Domain Expert":    return "Domain Expert";
    default:                 return "Domain Expert";
  }
}
