// Dev toggle: when true, the app skips PDF extraction and Groq entirely and
// renders canned data instead. Flip to false to exercise the real pipeline.
export const USE_MOCK = true;

// Matches the exact JSON shape lib/reportAdapter.js expects from a real Groq
// extraction (see lib/pdfExtractor.js) — reuses the real sample report's
// values so mock mode looks identical to a genuine successful extraction.
export const MOCK_DATA = {
  patient: { id: '2342', name: 'Ravi Kumar', age: 22, sex: 'Male', date: '06 Aug 2026' },
  rbc: {
    haemoglobin: { value: 12.5, unit: 'g/dL', ref_low: 13.0, ref_high: 17.0, flag: 'low' },
    rbc_count: { value: 5.2, unit: 'mill/cumm', ref_low: 4.5, ref_high: 5.5, flag: 'normal' },
    pcv: { value: 57.5, unit: '%', ref_low: 40, ref_high: 50, flag: 'high' },
    mcv: { value: 87.75, unit: 'fL', ref_low: 83, ref_high: 101, flag: 'normal' },
    mch: { value: 27.2, unit: 'pg', ref_low: 27, ref_high: 32, flag: 'normal' },
    mchc: { value: 32.8, unit: 'g/dL', ref_low: 32.5, ref_high: 34.5, flag: 'normal' },
    rdw_cv: { value: 13.6, unit: '%', ref_low: 11.6, ref_high: 14.0, flag: 'normal' },
  },
  wbc: {
    total_wbc: { value: 9000, unit: 'cumm', ref_low: 4000, ref_high: 11000, flag: 'normal' },
    neutrophils: { value: 60, unit: '%', ref_low: 50, ref_high: 62, flag: 'normal' },
    lymphocytes: { value: 31, unit: '%', ref_low: 20, ref_high: 40, flag: 'normal' },
    eosinophils: { value: 1, unit: '%', ref_low: 0, ref_high: 6, flag: 'normal' },
    monocytes: { value: 7, unit: '%', ref_low: 0, ref_high: 10, flag: 'normal' },
    basophils: { value: 1, unit: '%', ref_low: 0, ref_high: 2, flag: 'normal' },
  },
  platelets: {
    platelet_count: { value: 150000, unit: 'cumm', ref_low: 150000, ref_high: 410000, flag: 'borderline' },
    mpv: { value: null, unit: null, ref_low: null, ref_high: null, flag: null },
  },
};

// Separate mock payload for DoctorQuestionsScreen — it calls Groq for a
// different kind of content ({intro, questions}) than MOCK_DATA, so it needs
// its own canned value rather than being derived from MOCK_DATA. Gated by
// the same USE_MOCK flag. Written to match MOCK_DATA's findings (low Hb,
// high PCV, borderline platelets) so the two stay consistent with each other.
export const MOCK_DOCTOR_QUESTIONS = {
  intro: 'Based on this report, here are a few things worth discussing with your doctor.',
  questions: [
    'My haemoglobin is a little low — could this be causing tiredness, and should I take iron supplements?',
    'My PCV (packed cell volume) is higher than the normal range — what could be causing this, and does it need further testing?',
    'My platelet count is at the low end of borderline — should I get it rechecked, and are there any symptoms I should watch for?',
    'Are any of these results connected to each other, or are they separate things to keep an eye on?',
  ],
};

// Mock payload for AskMyDocScreen — same idea as MOCK_DOCTOR_QUESTIONS but
// short, tappable question stubs (rather than full sentences) since these
// get quick-added to the user's saved list. Kept consistent with MOCK_DATA's
// low Hb / high PCV / borderline platelets findings.
export const MOCK_ASK_MY_DOC_QUESTIONS = [
  'Why is my Haemoglobin low?',
  'Do I need an iron supplement?',
  'Should I retest in 4–6 weeks or sooner?',
];
