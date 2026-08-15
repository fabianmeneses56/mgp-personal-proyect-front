import { AuthResponse } from "@/core/auth/actions/auth-actions";
import { ActivityItem } from "@/core/activity/interfaces/activity.interface";
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

export function buildActivityItems(): ActivityItem[] {
  return [
    {
      id: "activity-1",
      type: "category",
      action: "created",
      entityId: "category-1",
      description: "Push",
      weightGrams: null,
      weightUnit: null,
      createdAt: "2024-03-01T12:00:00.000Z",
    },
    {
      id: "activity-2",
      type: "exercise",
      action: "updated",
      entityId: "exercise-1",
      description: "Press banca",
      weightGrams: null,
      weightUnit: null,
      createdAt: "2024-02-01T09:30:00.000Z",
    },
    {
      id: "activity-3",
      type: "weight_history",
      action: "created",
      entityId: "entry-1",
      description: "Press banca",
      weightGrams: 80000,
      weightUnit: "kg",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  ];
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
