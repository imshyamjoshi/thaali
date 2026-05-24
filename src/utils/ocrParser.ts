export interface ParsedLabel {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  servingGrams: number | null;
  confidence: 'high' | 'medium' | 'low';
}

const PATTERNS = {
  calories: [
    /energy[^0-9]*(\d+\.?\d*)\s*kcal/i,
    /calories[^0-9]*(\d+\.?\d*)/i,
    /(\d+\.?\d*)\s*kcal/i,
  ],
  protein: [
    /protein[^0-9]*(\d+\.?\d*)\s*g/i,
    /proteins[^0-9]*(\d+\.?\d*)\s*g/i,
  ],
  carbs: [
    /carbohydrate[^0-9]*(\d+\.?\d*)\s*g/i,
    /total\s+carb[^0-9]*(\d+\.?\d*)\s*g/i,
    /carbs[^0-9]*(\d+\.?\d*)\s*g/i,
  ],
  fat: [
    /total\s+fat[^0-9]*(\d+\.?\d*)\s*g/i,
    /fat[^0-9]*(\d+\.?\d*)\s*g/i,
  ],
  serving: [
    /serving\s+size[^0-9]*(\d+\.?\d*)\s*g/i,
    /per\s+serve[^0-9]*(\d+\.?\d*)\s*g/i,
    /per\s+(\d+\.?\d*)\s*g/i,
  ],
};

function matchFirst(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) {
      const val = parseFloat(m[1]);
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return null;
}

export function parseLabel(ocrText: string): ParsedLabel {
  const calories = matchFirst(ocrText, PATTERNS.calories);
  const protein = matchFirst(ocrText, PATTERNS.protein);
  const carbs = matchFirst(ocrText, PATTERNS.carbs);
  const fat = matchFirst(ocrText, PATTERNS.fat);
  const servingGrams = matchFirst(ocrText, PATTERNS.serving);

  const filled = [calories, protein, carbs, fat].filter((v) => v !== null).length;
  const confidence = filled === 4 ? 'high' : filled >= 2 ? 'medium' : 'low';

  return { calories, protein, carbs, fat, servingGrams, confidence };
}

export function scaleToServings(parsed: ParsedLabel, servings: number): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return {
    calories: Math.round((parsed.calories ?? 0) * servings),
    protein: Math.round((parsed.protein ?? 0) * servings * 10) / 10,
    carbs: Math.round((parsed.carbs ?? 0) * servings * 10) / 10,
    fat: Math.round((parsed.fat ?? 0) * servings * 10) / 10,
  };
}
