import ConceptIcon from '@/components/icons/ConceptIcon';
import { DETAILED_PARAMS, WBC_DIFFERENTIAL } from '@/lib/data';

const PARAM_ROWS_CONFIG = {
  rbc: [
    { id: 'rbcCount', label: 'Total RBC Count' },
    { id: 'hb', label: 'Haemoglobin' },
    { id: 'pcv', label: 'PCV/HCT' },
    { id: 'mcv', label: 'MCV' },
    { id: 'mch', label: 'MCH' },
    { id: 'mchc', label: 'MCHC' },
    { id: 'rdwCv', label: 'RDW-CV' },
  ],
  wbc: [
    { id: 'totalWbc', label: 'Total WBC' },
    { id: 'neutrophils', label: 'Neutrophils' },
    { id: 'lymphocytes', label: 'Lymphocytes' },
    { id: 'monocytes', label: 'Monocytes' },
    { id: 'eosinophils', label: 'Eosinophils' },
    { id: 'basophils', label: 'Basophils' },
  ],
  plt: [
    { id: 'platelets', label: 'Platelet Count' },
    { id: 'mpv', label: 'MPV' },
  ],
};

function paramRowsFor(category) {
  const config = PARAM_ROWS_CONFIG[category] || [];
  const dataById = {};
  (DETAILED_PARAMS[category] || []).forEach((p) => {
    dataById[p.id] = p;
  });
  if (category === 'wbc') {
    WBC_DIFFERENTIAL.forEach((p) => {
      if (!dataById[p.id]) dataById[p.id] = p;
    });
  }
  return config.filter((row) => dataById[row.id]).map((row) => ({ ...row, ...dataById[row.id] }));
}

export default function ConceptScreen({
  backToOverview,
  currentCategoryName,
  currentCategoryBg,
  category,
  currentCategoryDesc,
  speakConceptDesc,
  t,
  goToParamResult,
}) {
  const rows = paramRowsFor(category);

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-y-auto pt-4 px-[22px] pb-[22px]"
      style={{ animation: 'fadeIn 0.3s ease' }}
    >
      <div className="flex items-center gap-[10px]">
        <div className="text-[24px] text-[#6B7280] cursor-pointer p-1" onClick={backToOverview}>‹</div>
        <div className="text-[19px] font-extrabold text-[#1A1A2E]">{currentCategoryName}</div>
      </div>

      <div
        className="flex justify-center items-center mt-4 h-[230px] rounded-[26px] overflow-hidden"
        style={{ background: currentCategoryBg }}
      >
        <ConceptIcon category={category} />
      </div>

      <div className="text-center text-[16.5px] text-[#1A1A2E] font-semibold mt-6 leading-[1.55] px-[6px]">
        {currentCategoryDesc}
      </div>

      <div className="flex justify-center mt-[18px]">
        <button
          className="bg-white border-[1.5px] border-[#F0DCD3] rounded-2xl px-5 py-3 text-[14px] font-bold text-[#C0392B] cursor-pointer flex items-center gap-[6px] shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          onClick={speakConceptDesc}
        >
          🔊 {t.listen}
        </button>
      </div>

      {rows.length > 0 && (
        <div className="mt-6">
          <div className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-[0.06em] mb-2">
            Parameters measured
          </div>
          <div className="bg-white rounded-2xl divide-y divide-[#F3EDE8] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between px-[18px] py-[14px] cursor-pointer"
                onClick={() =>
                  goToParamResult({
                    id: row.id,
                    label: row.label,
                    value: row.value,
                    unit: row.unit,
                    low: row.low,
                    high: row.high,
                    flag: row.flag,
                  })
                }
              >
                <span className="text-[15px] font-semibold text-[#1A1A2E]">{row.label}</span>
                <div className="flex items-center gap-[10px]">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: row.flag === 'within' ? '#4CAF50' : '#F44336' }}
                  />
                  <span className="text-[18px] text-[#C0392B] font-bold">›</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
