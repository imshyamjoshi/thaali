export interface ParsedLabel {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  servingGrams: number | null;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Extract numeric values from a single string. Handles "3.5", "3,5", "12".
 */
function numbersIn(s: string): number[] {
  const out: number[] = [];
  const re = /\d+(?:[.,]\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const v = parseFloat(m[0].replace(',', '.'));
    if (!isNaN(v)) out.push(v);
  }
  return out;
}

/**
 * For two-column FSSAI labels (e.g. "per serve | per 100g"), determine which
 * number column holds the per-serving value. Returns null if no two-column
 * header is detected (single-column label).
 */
function detectServingColumn(lines: string[]): 0 | 1 | null {
  for (const raw of lines) {
    const l = raw.toLowerCase();
    const serveIdx = l.search(/per\s*serv/);
    const idx100 = l.search(/100\s*g/);
    if (serveIdx !== -1 && idx100 !== -1) {
      return serveIdx < idx100 ? 0 : 1;
    }
  }
  return null;
}

/**
 * Find the first line matching `keyword`, then return the chosen number that
 * appears AFTER the keyword ON THAT SAME LINE. Crucially line-scoped: a
 * nutrient can never grab a number from a different row (the old bug).
 */
function valueOnLine(
  lines: string[],
  keyword: RegExp,
  servingCol: 0 | 1 | null,
  opts: { exclude?: RegExp } = {}
): number | null {
  for (const raw of lines) {
    if (opts.exclude && opts.exclude.test(raw)) continue;
    const m = keyword.exec(raw);
    if (!m) continue;
    const after = raw.slice(m.index + m[0].length);
    const nums = numbersIn(after);
    if (nums.length === 0) continue;
    if (nums.length >= 2 && servingCol !== null) {
      return nums[servingCol] ?? nums[0];
    }
    return nums[0];
  }
  return null;
}

/**
 * Energy needs special handling: lines often carry both kJ and kcal
 * (e.g. "Energy 2009 kJ 480 kcal") or put the unit before the number
 * (e.g. "Energy (kcal) 480"). Always prefer the kcal value.
 */
function caloriesOnLine(lines: string[], servingCol: 0 | 1 | null): number | null {
  for (const raw of lines) {
    if (!/energy|calorie/i.test(raw)) continue;

    // 1) number immediately before the unit: "480 kcal"
    const before = /(\d+(?:[.,]\d+)?)\s*k\s*cal/i.exec(raw);
    if (before) return parseFloat(before[1].replace(',', '.'));

    // 2) unit header before the number: "Energy (kcal) 480"
    const afterKcal = /k\s*cal[^0-9]*(\d+(?:[.,]\d+)?)/i.exec(raw);
    if (afterKcal) return parseFloat(afterKcal[1].replace(',', '.'));

    // 3) fall back to the numbers after the keyword
    const kw = /energy|calorie\w*/i.exec(raw);
    const after = kw ? raw.slice(kw.index + kw[0].length) : raw;
    let nums = numbersIn(after);
    if (nums.length === 0) continue;

    const hasKj = /kj/i.test(raw);
    const hasKcal = /k\s*cal/i.test(raw);
    if (hasKj && nums.length >= 2) nums = nums.slice(1); // drop the leading kJ value

    let val =
      nums.length >= 2 && servingCol !== null ? nums[servingCol] ?? nums[0] : nums[0];
    if (hasKj && !hasKcal) val = Math.round(val / 4.184); // kJ-only label → convert to kcal
    return val;
  }
  return null;
}

export function parseLabel(ocrText: string): ParsedLabel {
  const lines = ocrText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const servingCol = detectServingColumn(lines);

  const calories = caloriesOnLine(lines, servingCol);
  const protein = valueOnLine(lines, /protein/i, servingCol, { exclude: /vegetable|source/i });
  const carbs = valueOnLine(lines, /carbohydrate|total\s*carb|\bcarbs?\b/i, servingCol);
  // Total fat — but never the "saturated"/"trans"/"of which" sub-rows.
  const fat =
    valueOnLine(lines, /total\s*fat/i, servingCol) ??
    valueOnLine(lines, /fat/i, servingCol, { exclude: /satur|trans|of which/i });
  const servingGrams =
    valueOnLine(lines, /serving\s*size/i, null) ??
    valueOnLine(lines, /per\s*serve/i, null) ??
    valueOnLine(lines, /net\s*(?:wt|weight)/i, null);

  const filled = [calories, protein, carbs, fat].filter((v) => v !== null).length;
  const confidence = filled === 4 ? 'high' : filled >= 2 ? 'medium' : 'low';

  return { calories, protein, carbs, fat, servingGrams, confidence };
}

export function scaleToServings(
  parsed: ParsedLabel,
  servings: number
): { calories: number; protein: number; carbs: number; fat: number } {
  return {
    calories: Math.round((parsed.calories ?? 0) * servings),
    protein: Math.round((parsed.protein ?? 0) * servings * 10) / 10,
    carbs: Math.round((parsed.carbs ?? 0) * servings * 10) / 10,
    fat: Math.round((parsed.fat ?? 0) * servings * 10) / 10,
  };
}
