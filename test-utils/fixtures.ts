import { AuthResponse } from "@/core/auth/actions/auth-actions";
import { Category } from "@/core/categories/interfaces/category.interface";
import { WeightHistoryApiEntry } from "@/core/weight-history/interfaces/weight-history.interface";

export function buildAuthResponse(
  overrides: Partial<AuthResponse> = {},
): AuthResponse {
  return {
    id: "user-1",
    email: "user@example.com",
    fullName: "Test User",
    isActive: true,
    roles: ["user"],
    token: "token-123",
    ...overrides,
  };
}

export function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "category-1",
    name: "Push",
    exercise: [],
    ...overrides,
  };
}

export function buildWeightHistoryApiEntries(): WeightHistoryApiEntry[] {
  return [
    {
      id: "entry-2",
      weightGrams: 80000,
      weightUnit: "kg",
      note: null,
      date: "2024-02-01T00:00:00.000Z",
    },
    {
      id: "entry-1",
      weightGrams: 176370,
      weightUnit: "lb",
      note: "warm-up",
      date: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "entry-3",
      weightGrams: 82000,
      weightUnit: "kg",
      note: null,
      date: "2024-03-01T00:00:00.000Z",
    },
  ];
}
