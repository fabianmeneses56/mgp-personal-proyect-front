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
  weightKg: number; // weightGrams / 1000, rounded to 2 decimals
  note?: string;
  date: string; // ISO string
}

export function toDisplayWeight(weightGrams: number, weightUnit: string): number {
  if (weightUnit === "kg") return Math.round((weightGrams / 1000) * 100) / 100;
  if (weightUnit === "lb") return Math.round((weightGrams / 453.59237) * 100) / 100;
  return weightGrams; // "g"
}

export function toKg(weightGrams: number): number {
  return Math.round((weightGrams / 1000) * 100) / 100;
}
