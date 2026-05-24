import { getDatabase } from './database';
import { IndianDish } from '../types';

let cachedDishes: IndianDish[] | null = null;

export async function getAllDishes(): Promise<IndianDish[]> {
  if (cachedDishes) return cachedDishes;

  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    category: string;
    tags: string;
    servings: string;
  }>('SELECT * FROM indian_dishes ORDER BY category, name');

  cachedDishes = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    tags: JSON.parse(r.tags),
    servings: JSON.parse(r.servings),
  }));

  return cachedDishes;
}

export function filterDishes(dishes: IndianDish[], query: string): IndianDish[] {
  if (!query.trim()) return dishes;
  const q = query.toLowerCase();
  return dishes.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function groupByCategory(dishes: IndianDish[]): Record<string, IndianDish[]> {
  return dishes.reduce<Record<string, IndianDish[]>>((acc, dish) => {
    if (!acc[dish.category]) acc[dish.category] = [];
    acc[dish.category].push(dish);
    return acc;
  }, {});
}
