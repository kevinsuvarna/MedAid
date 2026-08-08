import { useEffect, useState } from 'react';
import { DETAILED_PARAMS, WBC_DIFFERENTIAL } from '@/lib/data';
import { speak, stopSpeech } from '@/lib/speech';
import { callGroq } from '@/lib/groqClient';
import { ResultGauge, gaugePercentFor, flagColorFor } from '@/components/screens/ResultScreen';

const LISTEN_SYSTEM_PROMPT =
  'You are a helpful medical assistant explaining blood test results to a patient with low health literacy in India. Speak in simple, calm, non-alarming language. Maximum 4 sentences.';

function flagWord(flag) {
  if (flag === 'below') return 'low';
  if (flag === 'above') return 'high';
  return 'normal';
}

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

const PARAM_INSIGHTS = {
  rbcCount: 'A low count means fewer cells to carry oxygen around your body.',
  hb: 'Low levels can make you feel tired or short of breath.',
  pcv: 'A low value often confirms that your red cell count is reduced.',
  mcv: 'Small cells usually point to low iron; large cells to low B12 or folate.',
  mch: 'Low values mean each cell is carrying less oxygen than it should.',
  mchc: 'Very low values can indicate iron deficiency anaemia.',
  rdwCv: 'A high value means your red cells vary a lot in size, which can be an early sign of a deficiency.',
  totalWbc: 'A high count usually means your body is actively fighting something.',
  neutrophils: 'High levels are a common sign of a bacterial infection.',
  lymphocytes: 'Low levels can affect how well your body responds to viruses.',
  monocytes: 'Raised levels can indicate ongoing inflammation.',
  eosinophils: 'High values are often linked to allergies or parasitic infection.',
  basophils: 'Rarely a concern unless several other values are also abnormal.',
  platelets: 'Low counts mean your blood may take longer to clot after a cut.',
  mpv: 'High MPV with low count can indicate your body is trying to make more platelets.',
};

const CATEGORY_NOUN = { rbc: 'red cell', wbc: 'white cell', plt: 'platelet' };

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

function statusSummaryFor(category, hasAbnormal) {
  const noun = CATEGORY_NOUN[category] || 'blood cell';
  return hasAbnormal
    ? `Some of your ${noun} values need your doctor's attention.`
    : `All your ${noun} values are in a healthy range.`;
}

export default function ConceptScreen({
  currentCategoryName,
  category,
  currentCategoryDesc,
  t,
  audioMode,
  langCode,
  goToFaq,
  goToAsk,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [isListenLoading, setIsListenLoading] = useState(false);

  const rows = paramRowsFor(category);
  const abnormalRows = rows.filter((row) => row.flag !== 'within');
  const hasAbnormal = abnormalRows.length > 0;
  const statusSummary = statusSummaryFor(category, hasAbnormal);

  async function playListenSummary() {
    setIsListenLoading(true);
    const valuesList = rows
      .map((row) => `${row.label}: ${row.value} ${row.unit} (${flagWord(row.flag)})`)
      .join('; ');
    const userPrompt = `The patient's CBC category is ${currentCategoryName}. Here are the values: ${valuesList}. Give a short spoken summary: what these results mean overall, and flag any abnormal values gently.`;
    const text = await callGroq(LISTEN_SYSTEM_PROMPT, userPrompt);
    speak(text, langCode);
    setIsListenLoading(false);
  }

  useEffect(() => {
    let timer;
    if (audioMode) {
      timer = setTimeout(() => playListenSummary(), 1000);
    }
    return () => {
      clearTimeout(timer);
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleRow(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-y-auto pt-4 px-[22px] pb-[22px]"
      style={{ animation: 'fadeIn 0.3s ease' }}
    >
      <div className="flex items-center justify-between gap-[10px]">
        <div className="text-[19px] font-extrabold text-[#1A1A2E]">{currentCategoryName}</div>
        <div className="relative group flex-shrink-0">
          <button
            className="w-[28px] h-[28px] rounded-full bg-white border-[1.5px] border-[#D9D2C9] flex items-center justify-center text-[13px] font-bold text-[#3A3A3A] cursor-pointer"
            onClick={goToFaq}
            aria-label="Questions?"
          >
            ?
          </button>
          <div className="pointer-events-none absolute right-0 top-[34px] opacity-0 group-hover:opacity-100 transition-opacity bg-[#1A1A2E] text-white text-[11px] font-semibold px-[10px] py-[6px] rounded-lg whitespace-nowrap z-10">
            Questions?
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 mt-5">
        <div className="flex-1">
          <div className="text-[16px] font-medium text-[#1A1A2E] leading-[1.5]">{currentCategoryDesc}</div>
          <div className="text-[14px] text-[#6B7280] font-medium mt-2 leading-[1.5]">{statusSummary}</div>
        </div>
        <button
          className="bg-white border-[1.5px] border-[#F0DCD3] rounded-full w-[40px] h-[40px] flex items-center justify-center text-[16px] cursor-pointer flex-shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.06)] disabled:opacity-60 disabled:cursor-default"
          onClick={playListenSummary}
          disabled={isListenLoading}
          aria-label={t.listen}
        >
          {isListenLoading ? (
            <span className="w-4 h-4 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
          ) : (
            '🔊'
          )}
        </button>
      </div>

      {rows.length > 0 && (
        <div className="mt-6">
          <div className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-[0.06em] mb-2">
            Parameters measured
          </div>
          <div className="bg-white rounded-2xl divide-y divide-[#F3EDE8] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
            {rows.map((row) => {
              const isOpen = expandedId === row.id;
              const flagColor = flagColorFor(row.flag);
              const gaugePercent = gaugePercentFor(row);
              return (
                <div key={row.id}>
                  <div
                    className="flex items-center justify-between px-[18px] py-[14px] cursor-pointer"
                    onClick={() => toggleRow(row.id)}
                  >
                    <span className="text-[15px] font-semibold text-[#1A1A2E]">{row.label}</span>
                    <div className="flex items-center gap-[10px]">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: row.flag === 'within' ? '#4CAF50' : '#F44336' }}
                      />
                      <span
                        className="text-[18px] text-[#C0392B] font-bold"
                        style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none' }}
                      >
                        ›
                      </span>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="px-[18px] pb-[18px]">
                      <ResultGauge
                        gaugePercent={gaugePercent}
                        flagColor={flagColor}
                        patientValue={row.value}
                        low={row.low}
                        high={row.high}
                      />
                      <div className="text-[13.5px] text-[#1A1A2E] font-medium leading-[1.5] mt-4">
                        {PARAM_INSIGHTS[row.id]}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1" />
      <button
        className="w-full mt-6 bg-transparent text-[#C0392B] border-[1.5px] border-[#F0DCD3] rounded-[27px] px-[10px] py-[15px] text-[14px] font-bold cursor-pointer min-h-[52px] flex items-center justify-center gap-[6px]"
        onClick={goToAsk}
      >
        💬 More
      </button>
    </div>
  );
}
