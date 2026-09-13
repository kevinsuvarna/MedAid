// Canonical healthy ranges — the source of truth for every gauge/bar's
// low/high bounds, regardless of what ref_low/ref_high a given report's
// extraction returned (which can be missing or wrong, e.g. OCR misreads).
// Male adult ranges (the previous single CBC_REFERENCE_RANGES table).
export const CBC_REFERENCE_RANGES_MALE = {
  // RBC
  hemoglobin: { min: 13.0, max: 17.0, unit: 'g/dL', label: 'Hemoglobin (Hb)' },
  rbc: { min: 4.5, max: 5.5, unit: 'mill/cumm', label: 'Total RBC Count' },
  pcv: { min: 40, max: 50, unit: '%', label: 'Packed Cell Volume (PCV)' },
  mcv: { min: 83, max: 101, unit: 'fL', label: 'Mean Corpuscular Volume (MCV)' },
  mch: { min: 27, max: 32, unit: 'pg', label: 'MCH' },
  mchc: { min: 32.5, max: 34.5, unit: 'g/dL', label: 'MCHC' },
  rdw: { min: 11.6, max: 14.0, unit: '%', label: 'RDW' },

  // WBC
  wbc: { min: 4000, max: 11000, unit: 'cumm', label: 'Total WBC Count' },
  neutrophils: { min: 50, max: 62, unit: '%', label: 'Neutrophils' },
  lymphocytes: { min: 20, max: 40, unit: '%', label: 'Lymphocytes' },
  eosinophils: { min: 0, max: 6, unit: '%', label: 'Eosinophils' },
  monocytes: { min: 0, max: 10, unit: '%', label: 'Monocytes' },
  basophils: { min: 0, max: 2, unit: '%', label: 'Basophils' },

  // Platelets
  platelets: { min: 150000, max: 410000, unit: 'cumm', label: 'Platelet Count' },
};

// Female adult ranges — Hemoglobin/RBC/PCV differ from male; everything else
// (indices, WBC, differential, platelets) is sex-independent and matches.
// Source: standard Indian pathology lab ranges (ICMR / WHO aligned).
export const CBC_REFERENCE_RANGES_FEMALE = {
  hemoglobin: { min: 12.0, max: 15.0, unit: 'g/dL', label: 'Hemoglobin (Hb)' },
  rbc: { min: 3.8, max: 5.2, unit: 'mill/cumm', label: 'Total RBC Count' },
  pcv: { min: 36, max: 46, unit: '%', label: 'Packed Cell Volume (PCV)' },

  mcv: { min: 83, max: 101, unit: 'fL', label: 'Mean Corpuscular Volume (MCV)' },
  mch: { min: 27, max: 32, unit: 'pg', label: 'MCH' },
  mchc: { min: 32.5, max: 34.5, unit: 'g/dL', label: 'MCHC' },
  rdw: { min: 11.6, max: 14.0, unit: '%', label: 'RDW' },

  wbc: { min: 4000, max: 11000, unit: 'cumm', label: 'Total WBC Count' },
  neutrophils: { min: 50, max: 62, unit: '%', label: 'Neutrophils' },
  lymphocytes: { min: 20, max: 40, unit: '%', label: 'Lymphocytes' },
  eosinophils: { min: 0, max: 6, unit: '%', label: 'Eosinophils' },
  monocytes: { min: 0, max: 10, unit: '%', label: 'Monocytes' },
  basophils: { min: 0, max: 2, unit: '%', label: 'Basophils' },

  platelets: { min: 150000, max: 410000, unit: 'cumm', label: 'Platelet Count' },
};

// Defaults to male ranges when sex is missing/unrecognized — matches prior
// behavior (a single table) for reports where extraction couldn't read sex.
export function getReferenceRanges(sex) {
  if (typeof sex === 'string' && sex.trim().toLowerCase().startsWith('f')) {
    return CBC_REFERENCE_RANGES_FEMALE;
  }
  return CBC_REFERENCE_RANGES_MALE;
}

export const CAT_DEFS = [
  { id: 'rbc', bg: '#FBE4DA', accent: '#C0392B' },
  { id: 'wbc', bg: '#E4EEFB', accent: '#2E86DE' },
  { id: 'plt', bg: '#EDE8FB', accent: '#6C5CE7' },
];

export const SCREEN_STEP = {
  opening: 0,
  overview: 1,
  concept: 2,
  result: 3,
  ask: 3,
  explanation: 3,
  wbcDifferential: 3,
  followUps: 3,
  saved: 3,
};

export const CATEGORY_TAGLINES = {
  rbc: 'Carries oxygen to give your body energy',
  wbc: 'Keeps your body safe from infections',
  plt: 'Stops bleeding and helps with healing',
};

export const FACTS = {
  en: {
    rbc: [
      { icon: '🩸', text: 'Haemoglobin carries oxygen from your lungs to your body.' },
      { icon: '⚡', text: 'Low levels can make you feel tired or short of breath.' },
      { icon: '🥗', text: 'Iron-rich foods like spinach and lentils may help.' },
    ],
    wbc: [
      { icon: '🛡️', text: 'White blood cells help your body fight germs and infections.' },
      { icon: '⚡', text: 'Low levels can make it harder to fight illness.' },
      { icon: '🍊', text: 'Rest, hygiene and a balanced diet support your immune system.' },
    ],
    plt: [
      { icon: '🩹', text: 'Platelets help your blood clot and stop bleeding.' },
      { icon: '⚡', text: 'Low levels can cause easy bruising or bleeding.' },
      { icon: '🥦', text: 'Folate-rich foods like leafy greens may help.' },
    ],
  },
  hi: {
    rbc: [
      { icon: '🩸', text: 'हीमोग्लोबिन आपके फेफड़ों से शरीर तक ऑक्सीजन ले जाता है।' },
      { icon: '⚡', text: 'कम स्तर होने पर आपको थकान या सांस फूलने जैसा महसूस हो सकता है।' },
      { icon: '🥗', text: 'पालक और दाल जैसे आयरन युक्त खाद्य पदार्थ मदद कर सकते हैं।' },
    ],
    wbc: [
      { icon: '🛡️', text: 'श्वेत रक्त कोशिकाएं आपके शरीर को कीटाणुओं और संक्रमणों से लड़ने में मदद करती हैं।' },
      { icon: '⚡', text: 'कम स्तर होने पर बीमारी से लड़ना मुश्किल हो सकता है।' },
      { icon: '🍊', text: 'आराम, स्वच्छता और संतुलित आहार आपकी प्रतिरक्षा प्रणाली को सहायता देते हैं।' },
    ],
    plt: [
      { icon: '🩹', text: 'प्लेटलेट्स आपके खून का थक्का बनाने और रक्तस्राव रोकने में मदद करते हैं।' },
      { icon: '⚡', text: 'कम स्तर होने पर आसानी से चोट या रक्तस्राव हो सकता है।' },
      { icon: '🥦', text: 'पत्तेदार सब्जियों जैसे फोलेट युक्त खाद्य पदार्थ मदद कर सकते हैं।' },
    ],
  },
  te: {
    rbc: [
      { icon: '🩸', text: 'హీమోగ్లోబిన్ మీ ఊపిరితిత్తుల నుండి శరీరానికి ఆక్సిజన్‌ను తీసుకువెళ్తుంది.' },
      { icon: '⚡', text: 'తక్కువ స్థాయిలు మిమ్మల్ని అలసటగా లేదా ఊపిరి ఆడకుండా అనిపించవచ్చు.' },
      { icon: '🥗', text: 'పాలకూర, పప్పుధాన్యాల వంటి ఐరన్ అధికంగా ఉండే ఆహారాలు సహాయపడవచ్చు.' },
    ],
    wbc: [
      { icon: '🛡️', text: 'తెల్ల రక్త కణాలు మీ శరీరం సూక్ష్మజీవులు మరియు ఇన్‌ఫెక్షన్లతో పోరాడటానికి సహాయపడతాయి.' },
      { icon: '⚡', text: 'తక్కువ స్థాయిలు వ్యాధులతో పోరాడటం కష్టతరం చేయవచ్చు.' },
      { icon: '🍊', text: 'విశ్రాంతి, పరిశుభ్రత మరియు సమతుల్య ఆహారం మీ రోగనిరోధక వ్యవస్థకు మద్దతు ఇస్తాయి.' },
    ],
    plt: [
      { icon: '🩹', text: 'ప్లేట్‌లెట్స్ మీ రక్తం గడ్డకట్టడానికి మరియు రక్తస్రావాన్ని ఆపడానికి సహాయపడతాయి.' },
      { icon: '⚡', text: 'తక్కువ స్థాయిలు సులభంగా గాయాలు లేదా రక్తస్రావం కలిగించవచ్చు.' },
      { icon: '🥦', text: 'ఆకుకూరల వంటి ఫోలేట్ అధికంగా ఉండే ఆహారాలు సహాయపడవచ్చు.' },
    ],
  },
};

export const DIAGRAM_LABELS = {
  en: { rbc: ['Lungs', 'Blood', 'Body organs'], wbc: ['Germs', 'Immune response', 'Protection'], plt: ['Injury', 'Clotting', 'Stops bleeding'] },
  hi: { rbc: ['फेफड़े', 'खून', 'शरीर'], wbc: ['कीटाणु', 'प्रतिरक्षा प्रतिक्रिया', 'सुरक्षा'], plt: ['चोट', 'थक्का जमना', 'रक्तस्राव रुकना'] },
  te: { rbc: ['ఊపిరితిత్తులు', 'రక్తం', 'శరీరం'], wbc: ['సూక్ష్మజీవులు', 'రోగనిరోధక ప్రతిస్పందన', 'రక్షణ'], plt: ['గాయం', 'గడ్డకట్టడం', 'రక్తస్రావం ఆగడం'] },
};
