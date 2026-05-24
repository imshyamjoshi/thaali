export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  source: 'ocr' | 'ingredient' | 'indian_dish' | 'manual';
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;       // mg
  saturated_fat: number;
  image_uri: string | null;
  edited: boolean;
  synced: boolean;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  saturated_fat: number;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  saturated_fat: number;
}

export interface Ingredient {
  id: string;
  name: string;
  aliases: string[];
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    fiber: number;
    sodium: number;
    saturated_fat: number;
  };
}

export interface IndianDishServing {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  saturated_fat?: number;
}

export interface IndianDish {
  id: string;
  name: string;
  category: string;
  tags: string[];
  servings: IndianDishServing[];
}

