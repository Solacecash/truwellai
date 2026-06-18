export type GradedIngredient = {
  name: string;
  traffic: 'safe' | 'moderate' | 'avoid';
  note?: string;
};

export type GradePayload = {
  grade: string;
  score: number;
  summary: string;
  ingredients: GradedIngredient[];
};

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

export async function gradeWithOpenAI(input: {
  productName: string;
  ingredientText: string;
}): Promise<GradePayload> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return fallbackGrade(input);
  }

  const system = `You analyze packaged food ingredient lists for general wellness (not medical advice).
Return ONLY valid JSON with keys: grade (A-F), score (0-100), summary (2 short sentences), ingredients (array of {name, traffic: "safe"|"moderate"|"avoid", note optional}).
Be conservative: flag common allergens and additives as moderate or avoid when uncertain. No diagnosis.`;

  const userMsg = `Product: ${input.productName}\nIngredients text:\n${input.ingredientText || 'Unknown'}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error('openai error', res.status, t);
    return fallbackGrade(input);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') return fallbackGrade(input);

  try {
    const parsed = JSON.parse(raw);
    return normalizeGrade(parsed);
  } catch {
    return fallbackGrade(input);
  }
}

function normalizeGrade(p: Record<string, unknown>): GradePayload {
  const ingredients = (Array.isArray(p.ingredients) ? p.ingredients : []).map(
    (i: Record<string, unknown>) => ({
      name: String(i.name ?? 'Unknown'),
      traffic: normalizeTraffic(i.traffic),
      note: i.note ? String(i.note) : undefined,
    })
  );
  return {
    grade: String(p.grade ?? 'C').slice(0, 1).toUpperCase(),
    score: clamp(Number(p.score) || 70, 0, 100),
    summary: String(p.summary ?? 'We could not fully analyze this product.'),
    ingredients,
  };
}

function normalizeTraffic(t: unknown): GradedIngredient['traffic'] {
  if (t === 'safe' || t === 'moderate' || t === 'avoid') return t;
  return 'moderate';
}

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function fallbackGrade(input: { productName: string; ingredientText: string }): GradePayload {
  const lines = (input.ingredientText || '')
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  const ingredients: GradedIngredient[] = lines.map((name) => ({
    name,
    traffic: 'moderate' as const,
    note: 'Automatic mode — connect OpenAI for richer analysis.',
  }));
  if (!ingredients.length) {
    ingredients.push({
      name: 'Unknown composition',
      traffic: 'moderate',
      note: 'No ingredient text found.',
    });
  }
  return {
    grade: 'C',
    score: 72,
    summary: `${input.productName}: limited offline analysis. Add API keys for full TruWell grading.`,
    ingredients,
  };
}
