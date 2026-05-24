import { getDatabase, getMetaValue, setMetaValue } from './database';
import indianDishes from '../data/indian_dishes.json';
import ingredients from '../data/ingredients.json';

const SEED_VERSION = '3';

export async function seedDatabaseIfNeeded(): Promise<void> {
  const db = await getDatabase();
  const seeded = await getMetaValue('seed_version');
  if (seeded === SEED_VERSION) return;

  await seedIngredients(db);
  await seedIndianDishes(db);
  await setMetaValue('seed_version', SEED_VERSION);
}

async function seedIngredients(db: Awaited<ReturnType<typeof getDatabase>>): Promise<void> {
  await db.runAsync('DELETE FROM ingredients');
  await db.runAsync('DELETE FROM ingredients_fts');

  for (const item of ingredients) {
    await db.runAsync(
      `INSERT INTO ingredients (id, name, aliases, calories_per100g, protein_per100g, carbs_per100g, fat_per100g, sugar_per100g, fiber_per100g, sodium_per100g, saturated_fat_per100g)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id, item.name, JSON.stringify(item.aliases),
        item.per100g.calories, item.per100g.protein, item.per100g.carbs, item.per100g.fat,
        item.per100g.sugar, item.per100g.fiber, item.per100g.sodium, item.per100g.saturated_fat,
      ]
    );
  }

  // Rebuild FTS index
  await db.runAsync(
    `INSERT INTO ingredients_fts(name, aliases)
     SELECT name, aliases FROM ingredients`
  );
}

async function seedIndianDishes(db: Awaited<ReturnType<typeof getDatabase>>): Promise<void> {
  await db.runAsync('DELETE FROM indian_dishes');

  for (const dish of indianDishes) {
    await db.runAsync(
      `INSERT INTO indian_dishes (id, name, category, tags, servings)
       VALUES (?, ?, ?, ?, ?)`,
      [
        dish.id,
        dish.name,
        dish.category,
        JSON.stringify(dish.tags),
        JSON.stringify(dish.servings),
      ]
    );
  }
}
