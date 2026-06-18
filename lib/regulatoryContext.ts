/**
 * Maps country codes to their primary regulatory bodies and key
 * ingredient restrictions. Returned as a compact context string for the AI.
 */

const COUNTRY_REGULATORS: Record<string, { body: string; notes: string[] }> = {
  US: {
    body: 'FDA (Food and Drug Administration)',
    notes: [
      'FDA bans only 11 cosmetic ingredients versus the EU which bans over 1,300.',
      'Products must follow FDA labeling requirements under the FD&C Act.',
      'Formaldehyde-releasing preservatives like DMDM hydantoin are permitted but flagged.',
      'Recent FDA actions include recalls of benzene-contaminated dry shampoos.',
    ],
  },
  GB: {
    body: 'MHRA and UK Cosmetics Regulation (post-Brexit alignment with EU)',
    notes: [
      'UK follows EU-aligned cosmetic regulations banning 1,300+ ingredients.',
      'PFAS restrictions apply to waterproof cosmetics.',
      'Triclosan restricted in rinse-off personal care products.',
    ],
  },
  EU: {
    body: 'European Chemicals Agency (ECA) and EU Commission',
    notes: [
      'EU Cosmetics Regulation bans 1,328 ingredients and restricts 256 more.',
      'PFAS (per- and polyfluoroalkyl substances) restrictions ongoing.',
      'Methylisothiazolinone concentration reduced to 0.0015% in rinse-off products.',
      'Formaldehyde banned in cosmetics at any detectable level.',
      'Parabens restricted: only shorter-chain parabens allowed at limited concentrations.',
    ],
  },
  NG: {
    body: 'NAFDAC (National Agency for Food and Drug Administration and Control)',
    notes: [
      'NAFDAC has banned triclosan in personal care products including antibacterial soaps and deodorants.',
      'Mercury-containing skin-lightening products are illegal.',
      'Hydroquinone above 2% requires prescription.',
      'All cosmetics must be NAFDAC-registered before import or manufacture.',
    ],
  },
  CA: {
    body: 'Health Canada',
    notes: [
      'Canada prohibits 500+ cosmetic ingredients under the Cosmetic Ingredient Hotlist.',
      'Formaldehyde and formaldehyde-releasing preservatives are restricted.',
      'Diethanolamine (DEA) restricted in cosmetics.',
      'Canada aligns closely with the EU on PFAS restrictions.',
    ],
  },
  AU: {
    body: 'TGA (Therapeutic Goods Administration) and NICNAS/AICIS',
    notes: [
      'Australia follows the International Nomenclature of Cosmetic Ingredients (INCI) standards.',
      'Industrial Chemicals Act governs cosmetic ingredient safety.',
      'Triclosan restricted in products with food contact.',
      'SPF products regulated as therapeutic goods by TGA.',
    ],
  },
  ZA: {
    body: 'SAHPRA (South African Health Products Regulatory Authority)',
    notes: [
      'SAHPRA regulates cosmetics and personal care products.',
      'Mercury in skin-lightening products is banned.',
      'Hydroquinone above 2% requires pharmacist supervision.',
    ],
  },
  IN: {
    body: 'CDSCO (Central Drugs Standard Control Organisation) and BIS',
    notes: [
      'India follows the Drugs and Cosmetics Act for cosmetic regulation.',
      'Certain hair dyes with p-phenylenediamine (PPD) are restricted.',
      'BIS standards apply to personal care product quality.',
    ],
  },
};

/** Derive contextual regulatory information based on user country. */
export function getRegulatoryContext(country: string | null | undefined): string {
  if (!country) return '';

  const key = country.trim().toUpperCase();
  // Also try to match by country name
  const countryNameMap: Record<string, string> = {
    'UNITED STATES': 'US',
    'UNITED KINGDOM': 'GB',
    ENGLAND: 'GB',
    SCOTLAND: 'GB',
    NIGERIA: 'NG',
    CANADA: 'CA',
    AUSTRALIA: 'AU',
    'SOUTH AFRICA': 'ZA',
    INDIA: 'IN',
    GERMANY: 'EU',
    FRANCE: 'EU',
    ITALY: 'EU',
    SPAIN: 'EU',
    NETHERLANDS: 'EU',
    BELGIUM: 'EU',
    SWEDEN: 'EU',
    DENMARK: 'EU',
    POLAND: 'EU',
    PORTUGAL: 'EU',
  };

  const resolvedKey = COUNTRY_REGULATORS[key] ? key : (countryNameMap[key] ?? null);
  if (!resolvedKey) return '';

  const reg = COUNTRY_REGULATORS[resolvedKey];
  const lines = [
    `The user is located in ${country.trim()}.`,
    `Primary regulatory body: ${reg.body}.`,
    `Key local regulations:`,
    ...reg.notes.map((n) => `- ${n}`),
  ];
  return lines.join(' ');
}

/** Return relevant warnings specific to the user's country when an ingredient is flagged. */
export function getIngredientCountryNote(ingredient: string, country: string | null | undefined): string | null {
  if (!country) return null;
  const key = country.trim().toUpperCase();

  const warnings: Array<{ countries: string[]; ingredient: RegExp; note: string }> = [
    {
      countries: ['NG'],
      ingredient: /triclosan/i,
      note: 'Triclosan is banned by NAFDAC in Nigeria in personal care products.',
    },
    {
      countries: ['EU', 'GB', 'DE', 'FR'],
      ingredient: /formaldehyde|dmdm hydantoin|quaternium-15|imidazolidinyl urea/i,
      note: 'Formaldehyde and formaldehyde-releasing preservatives are banned in EU/UK cosmetics.',
    },
    {
      countries: ['US'],
      ingredient: /benzene/i,
      note: 'FDA has issued recalls for benzene-contaminated aerosol products in the US.',
    },
    {
      countries: ['CA', 'US', 'EU', 'AU'],
      ingredient: /pfas|polytetrafluoroethylene|ptfe/i,
      note: 'PFAS substances are under increasing regulatory scrutiny in your region.',
    },
  ];

  for (const w of warnings) {
    if (w.countries.some((c) => key.startsWith(c)) && w.ingredient.test(ingredient)) {
      return w.note;
    }
  }
  return null;
}
