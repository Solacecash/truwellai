import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://truwellai.xyz',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:8081',
  'http://localhost:19006',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

type Bundle = Record<string, unknown>;

const NON_DIAG =
  'This brief is informational only and is not a medical diagnosis or treatment plan. A licensed clinician is responsible for all clinical decisions.';

/** Deterministic filler when Anthropic key is unavailable or caller disables LLM. */
function heuristicAssemble(bundle: Bundle) {
  const profile = (bundle.profile as Record<string, unknown>) ?? {};
  const hp = (bundle.healthProfile as Record<string, unknown>) ?? {};
  const psych = (bundle.psych as Record<string, unknown> | null) ?? null;
  const excerpts = Array.isArray(bundle.chatExcerpts)
    ? (bundle.chatExcerpts as { role?: string; text?: string }[])
    : [];
  const titles = Array.isArray(bundle.recentSessionTitles) ? bundle.recentSessionTitles as string[] : [];
  const userCtx =
    typeof bundle.userProvidedContext === 'string'
      ? (bundle.userProvidedContext as string).trim()
      : '';

  const overviewBits: string[] = [];
  if (typeof profile.displayName === 'string' && profile.displayName) overviewBits.push(profile.displayName);
  if (typeof profile.email === 'string' && profile.email) overviewBits.push(`contact on file`);

  let goals =
    psych && typeof psych.healthGoal === 'string'
      ? String(psych.healthGoal)
      : 'Member wellness goals noted in TruWell onboarding or profile.';
  if (titles.length > 0) goals += ` Recent chat titles: ${titles.slice(0, 5).join('; ')}.`;

  let symptomsConcerns =
    excerpts
      .filter((e) => e.role === 'user')
      .slice(-12)
      .map((e) => e.text)
      .filter(Boolean)
      .join(' ')
      .slice(0, 1200) || 'No recent user excerpts were supplied.';

  const habits: string[] = [];
  if (typeof hp.activityLevel === 'string') habits.push(`Activity: ${hp.activityLevel}`);
  if (psych?.dietStyle) habits.push(`Diet style preference: ${String(psych.dietStyle)}`);
  if (typeof hp.age === 'number') habits.push(`Age: ${hp.age}`);
  if (typeof hp.biologicalSex === 'string') habits.push(`Biological sex: ${hp.biologicalSex}`);

  const lifestyle =
    habits.length > 0
      ? habits.join('. ')
      : 'No structured lifestyle telemetry was bundled beyond the TruWell assistant context.';

  const patternsParts: string[] = [];
  if (Array.isArray(hp.allergens) && (hp.allergens as unknown[]).length) {
    patternsParts.push(`Documented allergens: ${(hp.allergens as string[]).join(', ')}`);
  }
  if (Array.isArray(hp.conditions) && (hp.conditions as unknown[]).length) {
    patternsParts.push(`Documented conditions: ${(hp.conditions as string[]).join(', ')}`);
  }
  if (Array.isArray(psych?.painPoints) && psych && (psych.painPoints as unknown[]).length) {
    patternsParts.push(`Member noted focus areas: ${(psych.painPoints as string[]).join(', ')}`);
  }

  const keyPatterns =
    patternsParts.join(' ') ||
    'No patterned clinical signals were enumerated outside of basic profile fields. Confirm during visit.';

  const suggestedQs = [
    'What timelines or triggers matter most for the concerns you typed in TruWell?',
    'Are there diagnoses, meds, or supplements we should reconcile today?',
    'What outcomes would make this visit successful for you in the next 4 weeks?',
    'Would you like to review TruWell scans or recalls together for context?',
    'Anything you want your clinician to double-check versus prior records?',
  ];

  if (userCtx) suggestedQs.unshift(`You added this context in TruWell: ${userCtx.slice(0, 240)}`);

  const patientOverview =
    overviewBits.join(' • ') ||
    'Member requested a clinician brief from TruWell.';

  return {
    patientOverview,
    goals,
    symptomsConcerns,
    lifestyleSummary: lifestyle,
    keyPatternsObserved: keyPatterns,
    suggestedQuestionsForClinician: suggestedQs.slice(0, 7),
    briefVersion: 1,
    nonDiagnosticNotice: NON_DIAG,
  };
}

const ASSEMBLER_SYSTEM = `You assemble a clinician-facing HEALTH BRIEF for handoff in TruWell.
Return ONLY compact JSON as a single object (no prose, no fences) matching EXACTLY:
{"patientOverview":string,"goals":string,"symptomsConcerns":string,"lifestyleSummary":string,"keyPatternsObserved":string,"suggestedQuestionsForClinician":string[],"briefVersion":1,"nonDiagnosticNotice":string}

Rules:
1. NEVER diagnose or imply a definitive condition. Use hypothetical language ("member reports", "may warrant exploration").
2. Only restate derived facts supplied in INPUT_JSON. Clarify uncertainties if data is incomplete.
3. suggestedQuestionsForClinician MUST be clinician-style open questions—not commands.
4. briefVersion MUST be the number 1.
5. Copy nonDiagnosticNotice EXACTLY from INPUT_JSON.tailNotice (verbatim).
6. Keep each narrative field under ~900 characters.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) });

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data: authData, error: authErr } =
    await authClient.auth.getUser(token);
  if (authErr || !authData?.user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }

  try {
    const parsed = await req.json() as { bundle?: Bundle; useLlm?: boolean };
    const bundle = parsed.bundle ?? {};
    const tailNotice =
      NON_DIAG ||
      ((bundle as Record<string, unknown>).nonDiagnosticNotice as string | undefined) ||
      NON_DIAG;
    bundle.nonDiagnosticNotice = tailNotice;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const useLlm = parsed.useLlm !== false && !!anthropicKey;

    let sections;
    if (useLlm) {
      const client = new Anthropic({ apiKey: anthropicKey });
      const userJson = JSON.stringify({ INPUT_JSON: { ...bundle, tailNotice }, tailNotice });

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        temperature: 0.2,
        system: ASSEMBLER_SYSTEM,
        messages: [{ role: 'user', content: userJson }],
      });

      const modelText = message.content?.[0]?.type === 'text' ? message.content[0].text : '{}';
      let jsonText = modelText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/m, '');
      }
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      if (start < 0 || end < start) throw new Error('Assembler model returned invalid JSON envelope');
      sections = JSON.parse(jsonText.slice(start, end + 1)) as Record<string, unknown>;

      sections.briefVersion = 1;
      sections.nonDiagnosticNotice = typeof sections.nonDiagnosticNotice === 'string' ? sections.nonDiagnosticNotice : NON_DIAG;
      if (!Array.isArray(sections.suggestedQuestionsForClinician)) {
        sections.suggestedQuestionsForClinician = [];
      }
    } else {
      sections = heuristicAssemble(bundle);
    }

    return new Response(
      JSON.stringify({ sections, assembledAtIso: new Date().toISOString() }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (e) {
    console.error('[health-brief-assembler]', e);
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
