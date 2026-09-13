import { useEffect, useState } from 'react';
import { getParam } from '@/lib/reportAdapter';
import { speak, stopSpeech } from '@/lib/speech';
import { USE_MOCK } from '@/lib/config';
import BackArrowIcon from '@/components/icons/BackArrowIcon';

export const LANG_VOICE_CODE = {
  English: 'Eng',
  हिन्दी: 'Hin',
  తెలుగు: 'Tel',
  ಕನ್ನಡ: 'Kan',
  മലയാളം: 'Mal',
  தமிழ்: 'Tam',
};

export function voiceCodeFor(languageLabel) {
  if (!languageLabel) return '';
  return LANG_VOICE_CODE[languageLabel] || languageLabel.slice(0, 3);
}

export const TAB_DEFS = [
  { id: 'rbc', label: 'RBC' },
  { id: 'wbc', label: 'WBC' },
  { id: 'plt', label: 'Platelets' },
];

export function gaugePct(value, min, max) {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function GaugeBar({
  min,
  max,
  healthyLow,
  healthyHigh,
  value,
  lowLabel,
  healthyLabel,
  highLabel,
  trackHeight = 6,
  trackWidth = '100%',
  marginTop = 16,
  labelFontSize = 10,
  labelFontWeight = 700,
  valueFontWeight = 700,
}) {
  const healthyStart = gaugePct(healthyLow, min, max);
  const healthyEnd = gaugePct(healthyHigh, min, max);
  const dotPct = gaugePct(value, min, max);
  return (
    <div style={{ marginTop: `${marginTop}px`, width: trackWidth, marginLeft: 'auto', marginRight: 'auto' }}>
      <div
        className="relative rounded-full"
        style={{
          height: `${trackHeight}px`,
          background: `linear-gradient(90deg, #F44336 0%, #FFC107 ${healthyStart}%, #4CAF50 ${(healthyStart + healthyEnd) / 2}%, #FFC107 ${healthyEnd}%, #F5A623 100%)`,
        }}
      >
        <div
          className="absolute -top-[20px] -translate-x-1/2 text-[10px] text-[#1A237E] whitespace-nowrap"
          style={{ left: `${dotPct}%`, fontWeight: valueFontWeight }}
        >
          {value}
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[12px] h-[12px] rounded-full bg-white border-[3px] border-[#F44336] shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
          style={{ left: `${dotPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[#F44336]" style={{ fontSize: `${labelFontSize}px`, fontWeight: labelFontWeight }}>{lowLabel}</span>
        <span className="text-[#4CAF50]" style={{ fontSize: `${labelFontSize}px`, fontWeight: labelFontWeight }}>{healthyLabel}</span>
        <span className="text-[#F5A623]" style={{ fontSize: `${labelFontSize}px`, fontWeight: labelFontWeight }}>{highLabel}</span>
      </div>
    </div>
  );
}

export function SpeakerIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons/audio_follow.svg" alt="" style={{ width: 16.9, height: 15.8 }} />
  );
}

function InfoIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/info.svg"
      alt=""
      style={{ width: 14, height: 23, position: 'absolute', left: 7, top: 5.5 }}
    />
  );
}

export function dotColorForFlag(rawFlag) {
  if (rawFlag === 'normal') return '#4CAF50';
  if (rawFlag === 'borderline') return '#FFC107';
  return '#F44336';
}

// Index of each tab in TAB_DEFS — drives how far the sliding indicator
// pill below has to travel (translateX by activeIndex * 100%).
const TAB_INDEX = { rbc: 0, wbc: 1, plt: 2 };

// Shared top chrome for all three concept screens: back arrow + Voice pill,
// then the RBC/WBC/Platelets tab switcher + the info button (-> FollowUpsScreen).
// Rendered once by ConceptScreen.jsx (not per-category) so the tab indicator
// pill below is a persistent element whose position transition is actually
// visible, instead of being torn down and rebuilt on every tab switch.
export function ConceptTopChrome({ category, onSelectCategory, goToFollowUps, languageLabel, onBack, onLanguageClick }) {
  const activeIndex = TAB_INDEX[category] ?? 0;
  return (
    <>
      <div className="flex items-center justify-between px-[22px] pt-[26px]">
        <button
          className="flex items-center justify-center text-[#1A237E] bg-transparent border-none cursor-pointer"
          onClick={onBack}
          aria-label="Back"
        >
          <BackArrowIcon />
        </button>
        <div
          className="flex items-center gap-[6px] bg-white rounded-full px-3 py-[6px] cursor-pointer shadow-[0_4px_12px_rgba(26,35,126,0.12)]"
          onClick={onLanguageClick}
        >
          <span className="text-[12px] font-bold text-[#1A237E]">Voice: {voiceCodeFor(languageLabel)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 px-[22px] mt-4">
        <div className="relative flex-1 flex bg-white rounded-full p-1 shadow-[0_4px_12px_rgba(26,35,126,0.08)]">
          <div
            className="absolute top-1 bottom-1 left-1 rounded-full"
            style={{
              width: `calc((100% - 8px) / ${TAB_DEFS.length})`,
              transform: `translateX(${activeIndex * 100}%)`,
              transition: 'all 200ms ease',
              background: 'linear-gradient(135deg, #7B85D9 0%, #5A62C6 100%)',
              boxShadow: '0 3px 8px rgba(90,80,220,0.3)',
            }}
          />
          {TAB_DEFS.map((tab) => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                className={`relative z-[1] flex-1 text-[13px] font-bold rounded-full py-[8px] cursor-pointer border-none bg-transparent ${
                  active ? 'text-white' : 'text-[#9CA3AF]'
                }`}
                style={{ transition: 'color 200ms ease' }}
                onClick={() => {
                  if (!active) onSelectCategory(tab.id);
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          className="relative w-[34px] h-[34px] rounded-full bg-white shadow-[0_2px_10px_rgba(30,40,90,0.08)] cursor-pointer flex-shrink-0"
          onClick={goToFollowUps}
          aria-label="More info"
        >
          <InfoIcon />
        </button>
      </div>
    </>
  );
}

function WbcAvatar() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/wbc.svg"
      alt=""
      className="w-[46px] h-[46px] rounded-full flex-shrink-0 shadow-[0_3px_8px_rgba(90,80,220,0.3)]"
    />
  );
}

const TOTAL_WBC_GAUGE = {
  min: 0,
  max: 15000,
  healthyLow: 4000,
  healthyHigh: 11000,
  lowLabel: 'LOW (4000)',
  healthyLabel: 'HEALTHY (4000–11000)',
  highLabel: 'HIGH (11000)',
};

function formatUnit(unit) {
  return unit ? unit.replace(/cumm/g, 'cu. mm') : unit;
}

const WBC_STATUS_TEXT = {
  normal: 'Total WBC Count is in normal range',
  low: 'Total WBC Count is lower than normal range',
  high: 'Total WBC Count is higher than normal range',
  borderline: 'Total WBC Count is at the edge of normal range',
};

const WBC_SUB_PARAMS = [
  {
    id: 'neutrophils',
    name: 'Neutrophils',
    min: 0,
    max: 100,
    healthyLow: 50,
    healthyHigh: 62,
    lowLabel: 'LOW (0)',
    healthyLabel: 'HEALTHY (50–62)',
    highLabel: 'HIGH (100)',
    description: 'Helps fight bacterial infections',
    fact: 'A common sign of bacterial infection.',
    food: 'Citrus fruits & garlic help immunity.',
  },
  {
    id: 'lymphocytes',
    name: 'Lymphocytes',
    min: 0,
    max: 60,
    healthyLow: 20,
    healthyHigh: 40,
    lowLabel: 'LOW (0)',
    healthyLabel: 'HEALTHY (20–40)',
    highLabel: 'HIGH (60)',
    description: 'Fights viruses and builds immunity',
    fact: 'Low levels weaken your viral defense.',
    food: 'Leafy greens & Vitamin C help.',
  },
  {
    id: 'monocytes',
    name: 'Monocytes',
    min: 0,
    max: 20,
    healthyLow: 0,
    healthyHigh: 10,
    lowLabel: 'LOW (0)',
    healthyLabel: 'HEALTHY (0–10)',
    highLabel: 'HIGH (20)',
    description: 'Cleans up infections and dead cells',
    fact: 'High levels signal ongoing inflammation.',
    food: 'Turmeric & ginger support immunity.',
  },
  {
    id: 'eosinophils',
    name: 'Eosinophils',
    min: 0,
    max: 12,
    healthyLow: 0,
    healthyHigh: 6,
    lowLabel: 'LOW (0)',
    healthyLabel: 'HEALTHY (0–6)',
    highLabel: 'HIGH (12)',
    description: 'Responds to allergies and parasites',
    fact: 'Often linked to allergies or infection.',
    food: 'Fish & flaxseed (omega-3) may help.',
  },
  {
    id: 'basophils',
    name: 'Basophils',
    min: 0,
    max: 4,
    healthyLow: 0,
    healthyHigh: 2,
    lowLabel: 'LOW (0)',
    healthyLabel: 'HEALTHY (0–2)',
    highLabel: 'HIGH (4)',
    description: 'Signals the body during allergic reactions',
    fact: 'Rarely a concern on its own.',
    food: null,
  },
];

export default function WBCConceptScreen({ reportData, t, langCode, audioMode }) {
  const [expandedId, setExpandedId] = useState(null);
  const totalWbcParam = getParam(reportData, 'wbc', 'totalWbc');

  function playWbcSummary() {
    if (!totalWbcParam) return;
    const statusText = WBC_STATUS_TEXT[totalWbcParam.rawFlag] || WBC_STATUS_TEXT.normal;
    speak(`White Blood Cells. Total WBC: ${totalWbcParam.value} ${totalWbcParam.unit}. ${statusText}`, langCode);
  }

  useEffect(() => {
    if (!USE_MOCK && audioMode) playWbcSummary();
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
            <div className="text-[18px] font-bold text-[#1A237E]">White Blood Cells (WBC)</div>
            <button
              className="bg-transparent border-none cursor-pointer"
              onClick={playWbcSummary}
              aria-label={t.listen}
            >
              <SpeakerIcon />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <WbcAvatar />
            <div>
              <span className="text-[28px] font-bold text-[#1A237E]">{totalWbcParam ? totalWbcParam.value : '--'}</span>
              <span className="text-[10px] text-[#9CA3AF] ml-1">{totalWbcParam ? formatUnit(totalWbcParam.unit) : ''}</span>
            </div>
          </div>

          {totalWbcParam && (
            <>
              <GaugeBar
                min={TOTAL_WBC_GAUGE.min}
                max={TOTAL_WBC_GAUGE.max}
                healthyLow={TOTAL_WBC_GAUGE.healthyLow}
                healthyHigh={TOTAL_WBC_GAUGE.healthyHigh}
                value={totalWbcParam.value}
                lowLabel={TOTAL_WBC_GAUGE.lowLabel}
                healthyLabel={TOTAL_WBC_GAUGE.healthyLabel}
                highLabel={TOTAL_WBC_GAUGE.highLabel}
              />
              <div className="text-[13px] text-[#A8BAD4] mt-4">
                {WBC_STATUS_TEXT[totalWbcParam.rawFlag] || WBC_STATUS_TEXT.normal}
              </div>
            </>
          )}
        </div>

        <div className="mt-6">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.08em] mb-2 px-1">
            Parameters Measured
          </div>
          <div className="flex flex-col gap-[10px]">
            {WBC_SUB_PARAMS.map((sub) => {
              const param = getParam(reportData, 'wbc', sub.id);
              if (!param) return null;
              const isOpen = expandedId === sub.id;
              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-[16px] shadow-[0_3px_10px_rgba(30,40,90,0.06)] p-4 cursor-pointer"
                  onClick={() => toggleRow(sub.id)}
                >
                  <div className="relative flex items-center gap-3">
                    <div
                      className="text-[15px] font-bold leading-[1.2] flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ color: '#1E2350', maxWidth: '110px' }}
                    >
                      {sub.name}
                    </div>
                    <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[#6B7280]">
                      <span className="text-[14px]">{param.value}</span>
                      <span className="text-[11px] ml-1">{formatUnit(param.unit)}</span>
                    </span>
                    <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                      {!isOpen && (
                        <span
                          className="w-[10px] h-[10px] rounded-full flex-shrink-0"
                          style={{ background: dotColorForFlag(param.rawFlag) }}
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
                      <div className="text-[11px] text-[#64748B]">{sub.description}</div>
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
                      <div className="text-[11px] text-[#A8BAD4] mt-2 truncate">{sub.fact}</div>
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
