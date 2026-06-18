import { GradedIngredient, ScanResultPayload } from '@/stores/scanStore';

export function mapRemoteScan(data: Record<string, unknown>): ScanResultPayload {
  const ingRaw = data.ingredients;
  const ingredients: GradedIngredient[] = Array.isArray(ingRaw)
    ? ingRaw.map((i) => {
        const o = i as Record<string, unknown>;
        const traffic = o.traffic === 'safe' || o.traffic === 'avoid' ? o.traffic : 'moderate';
        return {
          name: String(o.name ?? ''),
          traffic,
          note: o.note ? String(o.note) : undefined,
        };
      })
    : [];

  return {
    grade: String(data.grade ?? 'C').slice(0, 1).toUpperCase(),
    score: Number(data.score ?? 0),
    summary: String(data.summary ?? ''),
    ingredients,
    productName:
      data.productName != null
        ? String(data.productName)
        : data.foodName != null
          ? String(data.foodName)
          : undefined,
    barcode: data.barcode != null ? String(data.barcode) : undefined,
    personalizedScore:
      data.personalizedScore != null ? Number(data.personalizedScore) : undefined,
    riskNotes: Array.isArray(data.riskNotes) ? (data.riskNotes as string[]) : undefined,
  };
}
