import { WeightHistoryEntry } from "@/core/weight-history/interfaces/weight-history.interface";

export type WeightHistorySortStrategy = (
  a: WeightHistoryEntry,
  b: WeightHistoryEntry,
) => number;

export const sortStrategies = {
  dateDesc: (a, b) => b.timestamp - a.timestamp,
  dateAsc: (a, b) => a.timestamp - b.timestamp,
  weightDesc: (a, b) => b.weightKg - a.weightKg,
  weightAsc: (a, b) => a.weightKg - b.weightKg,
} satisfies Record<string, WeightHistorySortStrategy>;

export type WeightHistorySortKey = keyof typeof sortStrategies;
