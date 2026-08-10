import { useEffect, useState } from 'react';
import { getParam } from '@/lib/reportAdapter';
import { speak, stopSpeech } from '@/lib/speech';
import { USE_MOCK } from '@/lib/config';
import { ConceptTopChrome, GaugeBar, SpeakerIcon, dotColorForFlag } from '@/components/screens/WBCConceptScreen';

function RbcAvatar() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/RBC_smiley.png"
      alt=""
      className="w-[46px] h-[46px] rounded-full flex-shrink-0 shadow-[0_3px_8px_rgba(239,83,80,0.3)]"
    />
  );
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
  normal: 'Total RBC Count is in normal range',
  low: 'Total RBC Count is lower than normal range',
  high: 'Total RBC Count is higher than normal range',
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

export default function RBCConceptScreen({
  reportData,
  t,
  langCode,
  audioMode,
  onSelectCategory,
  goToFollowUps,
  languageLabel,
  onBack,
  onLanguageClick,
}) {
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
      className="flex flex-col flex-1 min-h-0 overflow-y-auto pb-[22px]"
      style={{ animation: 'fadeIn 0.3s ease', background: '#D7E0F5' }}
    >
      <ConceptTopChrome
        category="rbc"
        onSelectCategory={onSelectCategory}
        goToFollowUps={goToFollowUps}
        languageLabel={languageLabel}
        onBack={onBack}
        onLanguageClick={onLanguageClick}
      />

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
            <div className="text-[18px] font-bold text-[#1A237E]">Red Blood Cells (RBC)</div>
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
              <span className="text-[16px] text-[#9CA3AF] ml-1">{totalRbcParam ? totalRbcParam.unit : ''}</span>
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
              <div className="text-[13px] text-[#6B7280] italic mt-4">
                {RBC_STATUS_TEXT[totalRbcParam.rawFlag] || RBC_STATUS_TEXT.normal}
              </div>
            </>
          )}
        </div>

        <div className="mt-6">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.08em] mb-2 px-1">
            Parameters Measured
          </div>
          <div className="flex flex-col gap-[10px]">
            {RBC_SUB_PARAMS.map((sub) => {
              const param = getParam(reportData, 'rbc', sub.id);
              if (!param) return null;
              const isOpen = expandedId === sub.id;
              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-[16px] shadow-[0_3px_10px_rgba(30,40,90,0.06)] p-4 cursor-pointer"
                  onClick={() => toggleRow(sub.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[15px] font-bold text-[#1A237E]">{sub.name}</div>
                      <div className="text-[11px] text-[#64748B] mt-[2px]">{sub.description}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[14px] text-[#6B7280]">
                        {param.value} <span className="text-[11px]">{param.unit}</span>
                      </span>
                      {!isOpen && (
                        <span
                          className="w-[10px] h-[10px] rounded-full flex-shrink-0"
                          style={{ background: dotColorForFlag(param.rawFlag) }}
                        />
                      )}
                      <span className="text-[16px] text-[#9CA3AF] flex-shrink-0">{isOpen ? '⌄' : '›'}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="mt-3">
                      <GaugeBar
                        min={sub.min}
                        max={sub.max}
                        healthyLow={sub.healthyLow}
                        healthyHigh={sub.healthyHigh}
                        value={param.value}
                        lowLabel={sub.lowLabel}
                        healthyLabel={sub.healthyLabel}
                        highLabel={sub.highLabel}
                      />
                      <div className="text-[11px] text-[#1A1A2E] mt-2 truncate">{sub.fact}</div>
                      {sub.food && <div className="text-[11px] text-[#6B7280] mt-1 truncate">{sub.food}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[12.5px] text-[#64748B] text-center mt-6">Tap each to know more</div>
      </div>
    </div>
  );
}
