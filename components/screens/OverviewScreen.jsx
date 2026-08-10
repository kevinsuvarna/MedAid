import { getParam, CATEGORY_PARAM_IDS } from '@/lib/reportAdapter';
import { speak } from '@/lib/speech';

const LANG_VOICE_CODE = {
  English: 'Eng',
  हिन्दी: 'Hin',
  తెలుగు: 'Tel',
  ಕನ್ನಡ: 'Kan',
  മലയാളం: 'Mal',
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

function CategoryIcon({ id, status }) {
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
    <div className="relative w-[44px] h-[44px] flex-shrink-0">
      <div
        className="w-[44px] h-[44px] rounded-full flex items-center justify-center"
        style={{ background: info.ringColor }}
      >
        <FaceIcon mood={moodFor(status)} />
      </div>
      <div className="absolute -top-[2px] -right-[2px] w-[18px] h-[18px] rounded-full bg-white flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
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
    <div className="flex flex-col flex-1 relative" style={{ animation: 'fadeIn 0.3s ease', background: '#D7E0F5' }}>
      <div className="flex items-center justify-between px-5 pt-[26px]">
        <button
          className="text-[20px] leading-none text-[#1A237E] bg-transparent border-none cursor-pointer"
          onClick={onBack}
          aria-label="Back"
        >
          ←
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

      <div className="relative flex flex-col flex-1 mx-auto mt-6 mb-[14px] w-[90%] bg-white/85 rounded-[24px] shadow-[0_8px_24px_rgba(26,35,126,0.14)] px-5 pt-5 pb-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="text-[18px] font-bold text-[#1E1B4B]">Report Summary</div>
          <button
            className="bg-transparent border-none cursor-pointer text-[#1E1B4B]"
            onClick={handleNarrate}
            aria-label="Listen"
          >
            🔊
          </button>
        </div>

        <div
          className="flex items-center gap-3 rounded-[14px] py-[10px] px-[14px] mt-4"
          style={{ background: hexToRgba(overallStyle.bg, 0.7), border: `1px solid ${hexToRgba(overallStyle.text, 0.12)}` }}
        >
          <div
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: overallStyle.smiley }}
          >
            <FaceIcon mood={overallStyle.mood} />
          </div>
          <div>
            <div className="text-[14px] font-extrabold text-[#20244F]">{overallTitle}</div>
            <div className="text-[11px] font-medium text-[#64748B] mt-[1px]">{overallSubtext}</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-14">
          {groupStatuses.map((cat) => {
            const info = CATEGORY_INFO[cat.id];
            const pill = STATUS_PILL_STYLE[cat.status];
            return (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-[14px] py-[10px] px-[14px] cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                style={{
                  background: '#FFFFFF',
                  border: `1.5px solid ${hexToRgba(pill.text, 0.4)}`,
                }}
                onClick={cat.select}
              >
                <CategoryIcon id={cat.id} status={cat.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-[#1E1B4B]">{info.name}</span>
                    <span
                      className="text-[8.5px] font-bold rounded-[6px] px-[7px] py-[2px] flex-shrink-0"
                      style={{ background: pill.bg, color: pill.labelText }}
                    >
                      {pill.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-[2px]">{info.desc}</div>
                </div>
                <div className="text-[16px] text-[#9CA3AF] flex-shrink-0">›</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[12px] text-[#9CA3AF] text-center mb-4">Tap one to Explore</div>
    </div>
  );
}
