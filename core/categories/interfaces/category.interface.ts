export interface Category {
  id: string;
  name: string;
  exercise: Exercise[];
}

export interface Exercise {
  id?: string;
  name: string;
  weightGrams?: number;
  weight?: number;
  weightUnit?: string;
  category?: string;
}
