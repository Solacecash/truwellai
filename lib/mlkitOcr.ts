/**
 * Google ML Kit Text Recognition — on-device OCR
 * Fast, free, works offline. Used as primary OCR
 * before sending to Claude Vision.
 */

import TextRecognition, {
  TextRecognitionScript,
} from '@react-native-ml-kit/text-recognition';

export interface MlKitOcrResult {
  text: string;
  confidence: number;
  blocks: number;
  success: boolean;
}

export async function runMlKitOcr(
  imageUri: string
): Promise<MlKitOcrResult> {
  try {
    const result = await TextRecognition.recognize(
      imageUri,
      TextRecognitionScript.LATIN
    );

    const text = result.text ?? '';
    const blocks = result.blocks?.length ?? 0;

    // Estimate confidence from block count and text length
    // ML Kit doesn't expose raw confidence scores
    const confidence = blocks > 3 && text.length > 50
      ? 0.85
      : blocks > 1 && text.length > 20
      ? 0.65
      : text.length > 5
      ? 0.40
      : 0.0;

    return {
      text,
      confidence,
      blocks,
      success: text.length > 0,
    };
  } catch (err) {
    return {
      text: '',
      confidence: 0,
      blocks: 0,
      success: false,
    };
  }
}

/**
 * Extract ingredient section from raw OCR text.
 * Looks for "Ingredients:" header and extracts
 * everything until the next section header.
 */
export function extractIngredientSection(
  rawText: string
): string {
  const lines = rawText.split('\n').map((l) => l.trim());

  const ingredientHeaders = [
    /^ingredients?[:\.]/i,
    /^contains[:\.]/i,
    /^composition[:\.]/i,
    /^ingrédients?[:\.]/i, // French
    /^ingredientes?[:\.]/i, // Spanish/Portuguese
  ];

  const sectionEnders = [
    /^nutrition facts/i,
    /^supplement facts/i,
    /^directions/i,
    /^warnings?/i,
    /^allergen/i,
    /^storage/i,
    /^best before/i,
    /^manufactured/i,
    /^distributed/i,
    /^net weight/i,
  ];

  let inSection = false;
  const ingredientLines: string[] = [];

  for (const line of lines) {
    if (!inSection) {
      const header = ingredientHeaders.find((h) => h.test(line));
      if (header) {
        inSection = true;
        // Include text after the header on the same line
        const afterHeader = line
          .replace(/^.*?ingredients?[:\.]\s*/i, '')
          .replace(/^.*?contains[:\.]\s*/i, '')
          .trim();
        if (afterHeader) ingredientLines.push(afterHeader);
        continue;
      }
    } else {
      if (sectionEnders.some((e) => e.test(line))) break;
      if (line.length > 0) ingredientLines.push(line);
    }
  }

  return ingredientLines.join(', ');
}
