export type ActivityType = "category" | "exercise" | "weight_history";
export type ActivityAction = "created" | "updated";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  action: ActivityAction;
  entityId: string;
  description: string; // snapshot del nombre al momento de la acción
  weightGrams: number | null; // solo type = "weight_history"
  weightUnit: string | null; // "kg" | "lb" | "g" | null
  createdAt: string; // ISO string
}
