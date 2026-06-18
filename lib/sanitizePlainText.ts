/**
 * Strips HTML-like tags before persisting member-entered prose.
 */
export function sanitizePlainText(raw: string, maxLen: number): string {
  const noTags = raw.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
  return noTags.trim().slice(0, maxLen);
}
