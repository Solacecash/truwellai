export const ONBOARDING_GOALS = [
  { id: 'product_safety', icon: '\uD83D\uDD0D', label: 'Know what\'s really in my products' },
  { id: 'weight', icon: '\u2696\uFE0F', label: 'Manage my weight & body composition' },
  { id: 'nutrition', icon: '\uD83E\uDD57', label: 'Eat smarter & understand my food' },
  { id: 'longevity', icon: '\uD83E\uDDEC', label: 'Live longer & age better' },
  { id: 'condition', icon: '\uD83D\uDC8A', label: 'Manage a health condition' },
  { id: 'allergies', icon: '\uD83D\uDEAB', label: 'Avoid allergens & harmful ingredients' },
  { id: 'energy', icon: '\u26A1', label: 'Boost my energy & vitality' },
  { id: 'family', icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67', label: 'Protect my family\'s health' },
  { id: 'pregnancy', icon: '\uD83E\uDD30', label: 'Stay safe during pregnancy' },
  { id: 'carcinogens', icon: '\u2623\uFE0F', label: 'Eliminate carcinogens from my life' },
  { id: 'fitness', icon: '\uD83C\uDFC3', label: 'Fuel my fitness & performance' },
  { id: 'mental', icon: '\uD83E\uDDE0', label: 'Improve mental clarity & focus' },
  { id: 'skin', icon: '\u2728', label: 'Use safer skincare & beauty products' },
  { id: 'recalls', icon: '\uD83D\uDEA8', label: 'Stay informed about product recalls' },
] as const;

export const AGE_RANGES = [
  'Under 18',
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
] as const;

export const GENDER_OPTIONS = [
  { id: 'male',       label: 'Male',              icon: '\u2642\uFE0F' },
  { id: 'female',     label: 'Female',            icon: '\u2640\uFE0F' },
  { id: 'non_binary', label: 'Non-binary',        icon: '\u26A7\uFE0F' },
  { id: 'prefer_not', label: 'Prefer not to say', icon: '\uD83D\uDD12' },
] as const;

export const HEALTH_CONDITIONS = [
  { id: 'none', label: 'None \u2014 I\'m generally healthy' },
  { id: 'diabetes', label: 'Diabetes or pre-diabetes' },
  { id: 'hypertension', label: 'Hypertension / High blood pressure' },
  { id: 'pregnancy', label: 'Pregnant or trying to conceive' },
  { id: 'thyroid', label: 'Thyroid condition' },
  { id: 'kidney', label: 'Kidney disease or issues' },
  { id: 'heart', label: 'Heart condition' },
  { id: 'autoimmune', label: 'Autoimmune condition' },
  { id: 'cancer', label: 'Cancer history or risk' },
  { id: 'liver', label: 'Liver condition' },
  { id: 'ibd', label: 'IBS / Digestive condition' },
  { id: 'mental', label: 'Mental health condition' },
] as const;

export const ALLERGY_OPTIONS = [
  { id: 'none', label: 'No known allergies' },
  { id: 'gluten', label: 'Gluten / Wheat' },
  { id: 'dairy', label: 'Dairy / Lactose' },
  { id: 'nuts', label: 'Tree nuts / Peanuts' },
  { id: 'soy', label: 'Soy' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'shellfish', label: 'Shellfish / Seafood' },
  { id: 'sulphites', label: 'Sulphites' },
  { id: 'fragrance', label: 'Fragrance / Perfume' },
  { id: 'nickel', label: 'Nickel (skin)' },
  { id: 'latex', label: 'Latex' },
  { id: 'sesame', label: 'Sesame' },
] as const;

export const DIET_OPTIONS = [
  { id: 'omnivore', label: 'I eat everything' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'keto', label: 'Keto / Low-carb' },
  { id: 'diabetic', label: 'Diabetic-friendly' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
  { id: 'gluten_free', label: 'Gluten-free' },
  { id: 'african_traditional', label: 'Traditional / Cultural diet' },
] as const;

export const PRODUCT_CONCERNS = [
  { id: 'carcinogens', label: 'Carcinogens & cancer-linked ingredients' },
  { id: 'endocrine', label: 'Endocrine disruptors' },
  { id: 'parabens', label: 'Parabens & preservatives' },
  { id: 'heavy_metals', label: 'Heavy metals (lead, mercury, arsenic)' },
  { id: 'artificial', label: 'Artificial colours & flavours' },
  { id: 'pesticides', label: 'Pesticide residues' },
  { id: 'microplastics', label: 'Microplastics' },
  { id: 'gmo', label: 'GMO ingredients' },
  { id: 'high_sodium', label: 'Excessive sodium & additives' },
  { id: 'alcohol', label: 'Hidden alcohol in products' },
  { id: 'sulphates', label: 'Sulphates (skincare)' },
  { id: 'fragrances', label: 'Synthetic fragrances' },
] as const;

export const SLEEP_OPTIONS = [
  'Less than 5hrs',
  '5-6hrs',
  '6-7hrs',
  '7-8hrs',
  '8-9hrs',
  '9+hrs',
] as const;

export const FAMILY_ROLE_OPTIONS = [
  { id: 'solo', label: 'Just me \u2014 single & independent' },
  { id: 'partner', label: 'In a relationship / married' },
  { id: 'parent', label: 'Parent with young children' },
  { id: 'caregiver', label: 'Caring for elderly or family member' },
  { id: 'pregnant', label: 'Pregnant or planning to be' },
  { id: 'student', label: 'Student \u2014 on a budget' },
  { id: 'professional', label: 'Working professional \u2014 always busy' },
] as const;

export const LIFESTYLE_OPTIONS = [
  { id: 'sedentary', icon: '\uD83E\uDE91', label: 'Mostly sitting \u2014 desk job' },
  { id: 'light', icon: '\uD83D\uDEB6', label: 'Light activity \u2014 short walks' },
  { id: 'moderate', icon: '\uD83D\uDEB4', label: 'Moderately active \u2014 gym 2\u20133x/week' },
  { id: 'active', icon: '\uD83C\uDFCB\uFE0F', label: 'Very active \u2014 gym 4\u20135x/week' },
  { id: 'athlete', icon: '\uD83C\uDFC6', label: 'Athlete or daily intense training' },
] as const;

export const STRESS_OPTIONS = [
  { id: 'low', label: '\uD83D\uDE0C Low \u2014 pretty chill' },
  { id: 'moderate', label: '\uD83D\uDE10 Moderate \u2014 manageable' },
  { id: 'high', label: '\uD83D\uDE30 High \u2014 often overwhelmed' },
  { id: 'very_high', label: '\uD83D\uDD25 Very high \u2014 burning out' },
] as const;

export const GOAL_LABELS: Record<string, string> = {
  product_safety: 'product safety intelligence',
  weight: 'weight & body composition',
  nutrition: 'smarter nutrition',
  longevity: 'longevity & healthy ageing',
  condition: 'condition management',
  allergies: 'allergen protection',
  energy: 'energy & vitality',
  family: 'family health protection',
  pregnancy: 'pregnancy safety',
  carcinogens: 'carcinogen elimination',
  fitness: 'fitness & performance',
  mental: 'mental clarity & focus',
  skin: 'safer skincare',
  recalls: 'real-time recall protection',
};

export const AI_PROCESSING_STEPS = [
  'Reading your health profile...',
  'Mapping your conditions & allergies...',
  'Building ingredient risk matrix...',
  'Configuring food intelligence engine...',
  'Calibrating Sofia to your history...',
  'Setting personalised safety thresholds...',
  'Connecting to global recall databases...',
  'Generating your TruWell Score...',
] as const;
