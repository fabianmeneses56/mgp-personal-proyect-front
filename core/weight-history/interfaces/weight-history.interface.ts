export interface WeightHistoryApiEntry {
  id: string;
  weightGrams: number;
  weightUnit: string; // "kg" | "lb" | "g"
  note: string | null;
  date: string; // ISO string
}

export interface WeightHistoryEntry {
  id: string;
  weight: number; // display value (already converted from weightGrams)
  weightUnit: string;
  note?: string;
  date: string; // ISO string
}

export function toDisplayWeight(weightGrams: number, weightUnit: string): number {
  if (weightUnit === "kg") return weightGrams / 1000;
  if (weightUnit === "lb") return weightGrams / 453.592;
  return weightGrams; // "g"
}
