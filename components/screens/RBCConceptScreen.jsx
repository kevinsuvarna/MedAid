import { useEffect, useState } from 'react';
import { getParam } from '@/lib/reportAdapter';
import { speak, stopSpeech } from '@/lib/speech';
import { USE_MOCK } from '@/lib/config';
import { GaugeBar, SpeakerIcon } from '@/components/screens/WBCConceptScreen';

function RbcAvatar() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/rbc.svg"
      alt=""
      className="w-[44px] h-[44px] rounded-full flex-shrink-0 shadow-[0_3px_8px_rgba(239,83,80,0.3)]"
    />
  );
}

// Joins the fact + food tip into a single sentence ("Low count can cause
// tiredness: Eat iron-rich food like palak and dal.") — strips the fact's
// own trailing period so it doesn't collide with the joining colon. Falls
// back to the fact alone when a sub-param has no food tip (e.g. MCHC), and
// hard-truncates at a word boundary if even the fact alone can't fit one
// line — the fact line must render as a single line with no wrap/ellipsis.
const FACT_LINE_MAX_CHARS = 62;

function truncateToWordBoundary(text, maxChars) {
  if (text.length <= maxChars) return text;
  const clipped = text.slice(0, maxChars);
  const lastSpace = clipped.lastIndexOf(' ');
  return lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped;
}

function bottomLineFor(sub) {
  if (sub.food) {
    const combined = `${sub.fact.replace(/\.\s*$/, '')}: ${sub.food}`;
    if (combined.length <= FACT_LINE_MAX_CHARS) return combined;
  }
  if (sub.fact.length <= FACT_LINE_MAX_CHARS) return sub.fact;
  return truncateToWordBoundary(sub.fact, FACT_LINE_MAX_CHARS);
}

const TOTAL_RBC_GAUGE = {
  min: 0,
  max: 8,
  healthyLow: 4.5,
  healthyHigh: 5.5,
  lowLabel: 'LOW (0)',
  healthyLabel: 'HEALTHY (4.5–5.5)',
  highLabel: 'HIGH (8)',
};

const RBC_STATUS_TEXT = {
  normal: 'Total RBC Count is in the normal range',
  low: 'Total RBC Count is slightly lower than normal range',
  high: 'Total RBC Count is slightly higher than normal range',
  borderline: 'Total RBC Count is at the edge of normal range',
};

const RBC_SUB_PARAMS = [
  {
    id: 'hb',
    name: 'Haemoglobin',
    min: 0,
    max: 25,
    healthyLow: 13,
    healthyHigh: 17,
    lowLabel: 'LOW (0)',
    healthyLabel: 'HEALTHY (13–17)',
    highLabel: 'HIGH (25)',
    description: 'Carries oxygen around your body',
    fact: 'Low count can cause tiredness.',
    food: 'Eat iron-rich food like palak and dal.',
  },
  {
    id: 'pcv',
    name: 'PCV/HCT',
    min: 0,
    max: 70,
    healthyLow: 40,
    healthyHigh: 50,
    lowLabel: 'LOW (0)',
    healthyLabel: 'HEALTHY (40–50)',
    highLabel: 'HIGH (70)',
    description: 'Measures how much of blood is red cells',
    fact: 'High levels can mean blood is too thick.',
    food: 'Stay well hydrated throughout the day.',
  },
  {
    id: 'mcv',
    name: 'MCV',
    min: 60,
    max: 120,
    healthyLow: 83,
    healthyHigh: 101,
    lowLabel: 'LOW (60)',
    healthyLabel: 'HEALTHY (83–101)',
    highLabel: 'HIGH (120)',
    description: 'Measures average size of red cells',
    fact: 'Small cells suggest low iron; large cells suggest low B12.',
    food: 'Eat eggs, dairy, and leafy greens for B12.',
  },
  {
    id: 'mch',
    name: 'MCH',
    min: 15,
    max: 40,
    healthyLow: 27,
    healthyHigh: 32,
    lowLabel: 'LOW (15)',
    healthyLabel: 'HEALTHY (27–32)',
    highLabel: 'HIGH (40)',
    description: 'Measures haemoglobin inside each cell',
    fact: 'Low values often point to iron deficiency.',
    food: 'Lentils, spinach, and red meat are rich in iron.',
  },
  {
    id: 'mchc',
    name: 'MCHC',
    min: 25,
    max: 40,
    healthyLow: 32.5,
    healthyHigh: 34.5,
    lowLabel: 'LOW (25)',
    healthyLabel: 'HEALTHY (32.5–34.5)',
    highLabel: 'HIGH (40)',
    description: 'Measures haemoglobin concentration in cells',
    fact: 'Very low values can indicate iron deficiency anaemia.',
    food: null,
  },
  {
    id: 'rdwCv',
    name: 'RDW-CV',
    min: 8,
    max: 20,
    healthyLow: 11.6,
    healthyHigh: 14,
    lowLabel: 'LOW (8)',
    healthyLabel: 'HEALTHY (11.6–14)',
    highLabel: 'HIGH (20)',
    description: 'Measures variation in red cell sizes',
    fact: 'A high value is often an early sign of deficiency.',
    food: 'Eat a varied diet with iron, B12, and folate.',
  },
];

export default function RBCConceptScreen({ reportData, t, langCode, audioMode }) {
  const [expandedId, setExpandedId] = useState(null);
  const totalRbcParam = getParam(reportData, 'rbc', 'rbcCount');

  function playRbcSummary() {
    if (!totalRbcParam) return;
    const statusText = RBC_STATUS_TEXT[totalRbcParam.rawFlag] || RBC_STATUS_TEXT.normal;
    speak(`Red Blood Cells. Total RBC: ${totalRbcParam.value} ${totalRbcParam.unit}. ${statusText}`, langCode);
  }

  useEffect(() => {
    if (!USE_MOCK && audioMode) playRbcSummary();
    return () => stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleRow(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div
      className="rounded-[26px] p-[14px] mt-4 mx-[22px]"
      style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 8px 30px rgba(30,40,90,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      <div className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-5">
          <div className="flex items-center justify-between">
            <div className="text-[18px] font-bold" style={{ color: '#1E2350' }}>Red Blood Cells (RBC)</div>
            <button
              className="bg-transparent border-none cursor-pointer"
              onClick={playRbcSummary}
              aria-label={t.listen}
            >
              <SpeakerIcon />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <RbcAvatar />
            <div>
              <span className="text-[28px] font-bold text-[#1A237E]">{totalRbcParam ? totalRbcParam.value : '--'}</span>
              <span className="text-[10px] text-[#9CA3AF] ml-1">{totalRbcParam ? totalRbcParam.unit : ''}</span>
            </div>
          </div>

          {totalRbcParam && (
            <>
              <GaugeBar
                min={TOTAL_RBC_GAUGE.min}
                max={TOTAL_RBC_GAUGE.max}
                healthyLow={TOTAL_RBC_GAUGE.healthyLow}
                healthyHigh={TOTAL_RBC_GAUGE.healthyHigh}
                value={totalRbcParam.value}
                lowLabel={TOTAL_RBC_GAUGE.lowLabel}
                healthyLabel={TOTAL_RBC_GAUGE.healthyLabel}
                highLabel={TOTAL_RBC_GAUGE.highLabel}
              />
              <div className="text-[13px] text-[#A8BAD4] mt-4">
                {RBC_STATUS_TEXT[totalRbcParam.rawFlag] || RBC_STATUS_TEXT.normal}
              </div>
            </>
          )}
        </div>

        <div className="mt-6">
          <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.08em] mb-2 px-1">
            Parameters Measured
          </div>
          <div className="flex flex-col gap-[10px]">
            {RBC_SUB_PARAMS.map((sub) => {
              const param = getParam(reportData, 'rbc', sub.id);
              if (!param) return null;
              const isOpen = expandedId === sub.id;
              const valueColor = isOpen ? '#454D59' : '#979AAE';
              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-[16px] shadow-[0_3px_10px_rgba(30,40,90,0.06)] p-4 cursor-pointer"
                  style={{
                    borderWidth: '2.19px',
                    borderStyle: 'solid',
                    borderColor: '#E2E8F0',
                  }}
                  onClick={() => toggleRow(sub.id)}
                >
                  <div className="relative flex items-center gap-3">
                    <div
                      className="text-[15px] font-bold leading-[1.2] flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ color: '#1E2350', maxWidth: '110px' }}
                    >
                      {sub.name}
                    </div>
                    <span
                      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
                      style={{ color: valueColor }}
                    >
                      <span className="text-[14px] leading-[1.2]">{param.value}</span>
                      <span className="text-[11px] font-normal ml-1 leading-[1.2]">{param.unit}</span>
                    </span>
                    <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                      {!isOpen && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={param.rawFlag === 'normal' ? '/icons/green_dot.svg' : '/icons/red_dot.svg'}
                          alt=""
                          style={{ width: 10, height: 10 }}
                        />
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={isOpen ? '/icons/down_arrow.svg' : '/icons/right_arrow.svg'}
                        alt=""
                        style={{ width: 6.5, height: 10.8 }}
                      />
                    </div>
                  </div>
                  {isOpen && (
                    <div className="mt-3">
                      <div className="text-[11px]" style={{ color: '#64748B' }}>{sub.description}</div>
                      <GaugeBar
                        min={sub.min}
                        max={sub.max}
                        healthyLow={sub.healthyLow}
                        healthyHigh={sub.healthyHigh}
                        value={param.value}
                        lowLabel={sub.lowLabel}
                        healthyLabel={sub.healthyLabel}
                        highLabel={sub.highLabel}
                        labelFontWeight={300}
                        valueFontWeight={300}
                      />
                      <div className="text-[11px] text-[#A8BAD4] mt-1 leading-[1.2] whitespace-nowrap overflow-hidden">{bottomLineFor(sub)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      <div className="text-[12.5px] text-[#64748B] text-center mt-6">Tap each to know more</div>
    </div>
  );
}
