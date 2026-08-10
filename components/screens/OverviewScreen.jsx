import { getParam, CATEGORY_PARAM_IDS } from '@/lib/reportAdapter';
import { speak } from '@/lib/speech';
import BackArrowIcon from '@/components/icons/BackArrowIcon';

const LANG_VOICE_CODE = {
  English: 'Eng',
  हिन्दी: 'Hin',
  తెలుగు: 'Tel',
  ಕನ್ನಡ: 'Kan',
  മലയാളം: 'Mal',
  தமிழ்: 'Tam',
};

function voiceCodeFor(languageLabel) {
  if (!languageLabel) return '';
  return LANG_VOICE_CODE[languageLabel] || languageLabel.slice(0, 3);
}

const CATEGORY_INFO = {
  rbc: { name: 'Red Blood Cells', desc: 'Gives energy & carries oxygen', ringColor: '#EF5350' },
  wbc: { name: 'White Blood Cells', desc: 'Fights infections & viruses', ringColor: '#5C6BC0' },
  plt: { name: 'Platelets', desc: 'Stops bleeding & heals wounds', ringColor: '#FFB300' },
};

// Happy/good mood already has a curved smile baked into these images; the
// neutral/flat moods still fall back to the hand-drawn FaceIcon below so the
// smile curvature can keep varying with severity.
const CATEGORY_SMILEY_IMG = {
  rbc: '/icons/rbc.svg',
  wbc: '/icons/wbc.svg',
  plt: '/icons/platelet.svg',
};

const STATUS_PILL_STYLE = {
  low: { label: 'LOW', bg: '#FEE2E2', text: '#C62828', labelText: '#991B1B' },
  high: { label: 'HIGH', bg: '#FEE2E2', text: '#C62828', labelText: '#991B1B' },
  border: { label: 'BORDER', bg: '#FEF3C7', text: '#F57F17', labelText: '#796928' },
  good: { label: 'GOOD', bg: '#DCFCE7', text: '#2E7D32', labelText: '#166534' },
};

function moodFor(status) {
  if (status === 'good') return 'happy';
  if (status === 'border') return 'neutral';
  return 'flat';
}

const OVERALL_STYLE = {
  green: { bg: '#B4EBD3', text: '#2E7D32', smiley: '#A5D6A7', mood: 'happy' },
  amber: { bg: '#FFF3D1', text: '#F57F17', smiley: '#FFE082', mood: 'neutral' },
  red: { bg: '#FFEFEF', text: '#C62828', smiley: '#EF9A9A', mood: 'flat' },
};

function rawFlagsFor(reportData, category) {
  return (CATEGORY_PARAM_IDS[category] || [])
    .map((id) => getParam(reportData, category, id))
    .filter(Boolean)
    .map((p) => p.rawFlag);
}

// 'high' is checked ahead of 'low' so a group with both (e.g. Hb low + PCV
// high in the same RBC panel) surfaces as HIGH — the more urgent of the two.
function groupStatusFor(reportData, category) {
  const flags = rawFlagsFor(reportData, category);
  if (flags.includes('high')) return 'high';
  if (flags.includes('low')) return 'low';
  if (flags.includes('borderline')) return 'border';
  return 'good';
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const SMILE_CONTROL_Y = { happy: 22, neutral: 18.5, flat: 17 };

function FaceIcon({ size = 26, mood = 'happy' }) {
  const controlY = SMILE_CONTROL_Y[mood] ?? SMILE_CONTROL_Y.happy;
  return (
    <svg width={size} height={size} viewBox="0 0 26 26">
      <ellipse cx="6" cy="12.5" rx="2.6" ry="1.8" fill="rgba(255,255,255,0.35)" />
      <ellipse cx="20" cy="12.5" rx="2.6" ry="1.8" fill="rgba(255,255,255,0.35)" />
      <circle cx="9.2" cy="10.5" r="1.9" fill="#1A1A2E" />
      <circle cx="16.8" cy="10.5" r="1.9" fill="#1A1A2E" />
      <circle cx="9.8" cy="9.8" r="0.6" fill="#FFFFFF" />
      <circle cx="17.4" cy="9.8" r="0.6" fill="#FFFFFF" />
      <path d={`M7.5 16 Q13 ${controlY} 18.5 16`} stroke="#1A1A2E" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 010 7" />
      <path d="M18 5.5a9 9 0 010 13" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function CategoryIcon({ id, status }) {
  const mood = moodFor(status);
  if (mood === 'happy') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={CATEGORY_SMILEY_IMG[id]} alt="" className="w-[42px] h-[42px] rounded-full flex-shrink-0" />
    );
  }
  const info = CATEGORY_INFO[id];
  const badge =
    id === 'rbc' ? (
      <span className="text-[7px] font-extrabold" style={{ color: info.ringColor }}>
        O₂
      </span>
    ) : id === 'wbc' ? (
      <svg width="9" height="11" viewBox="0 0 10 12">
        <path d="M5 0L9 1.5V5.5C9 8.5 7 10.5 5 12C3 10.5 1 8.5 1 5.5V1.5L5 0Z" fill="#5C6BC0" />
      </svg>
    ) : (
      <svg width="9" height="9" viewBox="0 0 10 10">
        <line x1="5" y1="0" x2="5" y2="10" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="5" x2="10" y2="5" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  return (
    <div className="relative w-[42px] h-[42px] flex-shrink-0">
      <div
        className="w-[42px] h-[42px] rounded-full flex items-center justify-center"
        style={{ background: info.ringColor }}
      >
        <FaceIcon mood={mood} size={22} />
      </div>
      <div className="absolute -top-[2px] -right-[2px] w-[16px] h-[16px] rounded-full bg-white flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
        {badge}
      </div>
    </div>
  );
}

export default function OverviewScreen({ categories, reportData, languageLabel, langCode, onBack, onLanguageClick }) {
  const patientId = (reportData && reportData.patient && reportData.patient.id) || '2342';

  const groupStatuses = categories.map((cat) => ({ ...cat, status: groupStatusFor(reportData, cat.id) }));
  const abnormalGroups = groupStatuses.filter((g) => g.status === 'low' || g.status === 'high');

  let overallTier;
  let overallTitle;
  let overallSubtext;
  if (abnormalGroups.length === 0) {
    overallTier = 'green';
    overallTitle = 'Healthy Range!';
    overallSubtext = 'All values are normal';
  } else if (abnormalGroups.length === 1) {
    overallTier = 'green';
    overallTitle = 'Mostly Healthy!';
    overallSubtext = `Only ${CATEGORY_INFO[abnormalGroups[0].id].name} needs attention`;
  } else if (abnormalGroups.length === 2) {
    overallTier = 'amber';
    overallTitle = 'Needs Care';
    overallSubtext = `${CATEGORY_INFO[abnormalGroups[0].id].name} and ${CATEGORY_INFO[abnormalGroups[1].id].name} need attention`;
  } else {
    overallTier = 'red';
    overallTitle = 'See Doctor';
    overallSubtext = 'All values need further review';
  }
  const overallStyle = OVERALL_STYLE[overallTier];

  function handleNarrate() {
    const lines = [
      `${overallTitle}. ${overallSubtext}`,
      ...groupStatuses.map((g) => `${CATEGORY_INFO[g.id].name}: ${STATUS_PILL_STYLE[g.status].label}`),
    ];
    speak(lines.join('. '), langCode);
  }

  return (
    <div className="flex flex-col flex-1 relative" style={{ background: '#D7E0F5' }}>
      <div className="flex items-center justify-between px-5 pt-[26px]">
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

      <div className="text-[22px] font-bold text-[#1E1B4B] text-center mt-4">Hello, {patientId}</div>
      <div className="text-[13px] text-[#64748B] text-center mt-1">Here is the quick overview of your blood test</div>

      <div
        className="relative flex flex-col flex-1 mx-auto mt-6 mb-[14px] w-[90%] rounded-[28px] pt-[22px] px-[18px] pb-[18px] overflow-y-auto"
        style={{
          background: 'linear-gradient(155deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.28) 100%)',
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.65)',
          boxShadow: '0 8px 30px rgba(35,45,90,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[19px] font-extrabold text-[#1E1B4B]">Report Summary</div>
          <button
            className="bg-transparent border-none cursor-pointer"
            onClick={handleNarrate}
            aria-label="Listen"
          >
            <SpeakerIcon />
          </button>
        </div>

        <div
          className="flex items-center gap-3 rounded-[18px] py-[22px] px-[14px] mt-5"
          style={{
            background: `linear-gradient(155deg, ${hexToRgba(overallStyle.bg, 0.85)}, ${hexToRgba(overallStyle.bg, 0.5)})`,
            border: `1px solid ${hexToRgba(overallStyle.text, 0.15)}`,
          }}
        >
          {overallStyle.mood === 'happy' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/icons/overall.svg" alt="" className="w-[38px] h-[38px] rounded-full flex-shrink-0" />
          ) : (
            <div
              className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: overallStyle.smiley }}
            >
              <FaceIcon mood={overallStyle.mood} size={20} />
            </div>
          )}
          <div>
            <div className="text-[14.5px] font-extrabold text-[#20244F]">{overallTitle}</div>
            <div className="text-[12px] font-medium text-[#64748B] mt-[1px]">{overallSubtext}</div>
          </div>
        </div>

        <div className="flex flex-col gap-5 mt-8">
          {groupStatuses.map((cat) => {
            const info = CATEGORY_INFO[cat.id];
            const pill = STATUS_PILL_STYLE[cat.status];
            return (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-[18px] py-[11px] px-[14px] cursor-pointer shadow-[0_1px_3px_rgba(35,45,90,0.06)]"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  border: `1px solid ${hexToRgba(pill.text, 0.35)}`,
                }}
                onClick={cat.select}
              >
                <CategoryIcon id={cat.id} status={cat.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-[#1E1B4B] whitespace-nowrap">{info.name}</span>
                    <span
                      className="text-[10px] font-bold rounded-[8px] px-[9px] py-[3px] flex-shrink-0"
                      style={{ background: pill.bg, color: pill.labelText }}
                    >
                      {pill.label}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-[#64748B] mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis">
                    {info.desc}
                  </div>
                </div>
                <ChevronIcon />
              </div>
            );
          })}
        </div>

        <div className="flex-1 min-h-4" />
        <div className="text-[12.5px] text-[#64748B] text-center mt-3">Tap one to explore</div>
      </div>
    </div>
  );
}
