const GROUP_KEY = { rbc: 'rbc', wbc: 'wbc', plt: 'platelets' };

const PARAM_KEY_MAP = {
  rbc: { hb: 'haemoglobin', rbcCount: 'rbc_count', mcv: 'mcv', mch: 'mch', mchc: 'mchc', pcv: 'pcv', rdwCv: 'rdw_cv' },
  wbc: {
    totalWbc: 'total_wbc',
    neutrophils: 'neutrophils',
    lymphocytes: 'lymphocytes',
    monocytes: 'monocytes',
    eosinophils: 'eosinophils',
    basophils: 'basophils',
  },
  plt: { platelets: 'platelet_count', mpv: 'mpv' },
};

export const CATEGORY_PARAM_IDS = {
  rbc: ['hb', 'rbcCount', 'mcv', 'mch', 'mchc', 'pcv', 'rdwCv'],
  wbc: ['totalWbc', 'neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils'],
  plt: ['platelets', 'mpv'],
};

export const DIFFERENTIAL_IDS = ['neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils'];

export function deriveGaugeFlag(value, low, high) {
  const v = Number(value);
  const l = Number(low);
  const h = Number(high);
  if (Number.isNaN(v) || Number.isNaN(l) || Number.isNaN(h)) return 'within';
  if (v < l) return 'below';
  if (v > h) return 'above';
  return 'within';
}

function getRawLeaf(reportData, category, internalId) {
  const groupKey = GROUP_KEY[category];
  const leafKey = PARAM_KEY_MAP[category] && PARAM_KEY_MAP[category][internalId];
  if (!reportData || !groupKey || !leafKey) return null;
  const group = reportData[groupKey];
  return (group && group[leafKey]) || null;
}

export function getParam(reportData, category, internalId) {
  const leaf = getRawLeaf(reportData, category, internalId);
  if (!leaf || leaf.value == null || leaf.ref_low == null || leaf.ref_high == null) return null;
  const value = Number(leaf.value);
  const low = Number(leaf.ref_low);
  const high = Number(leaf.ref_high);
  if (Number.isNaN(value) || Number.isNaN(low) || Number.isNaN(high)) return null;
  return {
    id: internalId,
    value,
    unit: leaf.unit || '',
    low,
    high,
    flag: deriveGaugeFlag(value, low, high),
    rawFlag: leaf.flag || null,
  };
}

export function getWbcDifferentialRows(reportData) {
  return DIFFERENTIAL_IDS.map((id) => getParam(reportData, 'wbc', id)).filter(Boolean);
}

export function tierForGroup(reportData, category) {
  const ids = CATEGORY_PARAM_IDS[category] || [];
  let abnormalCount = 0;
  ids.forEach((id) => {
    const leaf = getRawLeaf(reportData, category, id);
    if (leaf && leaf.flag && leaf.flag !== 'normal') abnormalCount += 1;
  });
  if (abnormalCount === 0) return 'green';
  if (abnormalCount === 1) return 'amber';
  return 'red';
}

export function getPatientInfo(reportData) {
  return (reportData && reportData.patient) || null;
}
