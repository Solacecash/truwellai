/**
 * Trim @react-native-ml-kit/text-recognition to Latin-only for iOS EAS builds.
 * Removes unused script pods/imports that break pod install and Xcode compile.
 */
const fs = require('fs');
const path = require('path');

const MARKER = 'TEXT_RECOGNITION_LATIN_ONLY';
const pkgRoot = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-ml-kit',
  'text-recognition',
);

if (!fs.existsSync(pkgRoot)) {
  console.log('[patch-mlkit] package not found, skipping');
  process.exit(0);
}

function patchPodspec() {
  const podspecPath = path.join(pkgRoot, 'RNMLKitTextRecognition.podspec');
  if (!fs.existsSync(podspecPath)) return;

  let content = fs.readFileSync(podspecPath, 'utf8');
  if (content.includes(MARKER)) return;

  content = content
    .split('\n')
    .filter(
      (line) =>
        !line.includes('TextRecognitionChinese') &&
        !line.includes('TextRecognitionDevanagari') &&
        !line.includes('TextRecognitionJapanese') &&
        !line.includes('TextRecognitionKorean') &&
        !line.includes('# To recognize Chinese') &&
        !line.includes('# To recognize Devanagari') &&
        !line.includes('# To recognize Japanese') &&
        !line.includes('# To recognize Korean'),
    )
    .join('\n')
    .replace(
      "s.dependency 'GoogleMLKit/TextRecognition', '8.0.0'",
      `s.dependency 'GoogleMLKit/TextRecognition', '8.0.0'\n  # ${MARKER}`,
    );

  fs.writeFileSync(podspecPath, content, 'utf8');
  console.log('[patch-mlkit] podspec patched');
}

function patchIosSource() {
  const sourcePath = path.join(pkgRoot, 'ios', 'TextRecognition.m');
  if (!fs.existsSync(sourcePath)) return;

  let content = fs.readFileSync(sourcePath, 'utf8');
  if (content.includes(MARKER)) return;

  content = content
    .replace('@import MLKitTextRecognitionChinese;\n', '')
    .replace('@import MLKitTextRecognitionJapanese;\n', '')
    .replace('@import MLKitTextRecognitionKorean;\n', '')
    .replace('@import MLKitTextRecognitionDevanagari;\n', '')
    .replace(
      /    \/\/ text recognizer options based on the script params[\s\S]*?    \} else \{[\s\S]*?    \}\n/,
      `    // ${MARKER}: TruWell uses Latin script only for ingredient label OCR.\n` +
        `    if (script != nil && ![script isEqualToString:@"Latin"]) {\n` +
        `        return reject(@"Text Recognition", @"Unsupported script", nil);\n` +
        `    }\n` +
        `    MLKCommonTextRecognizerOptions *options = [[MLKTextRecognizerOptions alloc] init];\n\n`,
    );

  fs.writeFileSync(sourcePath, content, 'utf8');
  console.log('[patch-mlkit] iOS source patched');
}

patchPodspec();
patchIosSource();
console.log('[patch-mlkit] done');
