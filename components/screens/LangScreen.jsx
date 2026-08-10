import { useState } from 'react';
import BackArrowIcon from '@/components/icons/BackArrowIcon';

const LANG_ORDER = ['English', 'हिन्दी', 'తెలుగు', 'ಕನ್ನಡ'];

function GlobeIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="37" stroke="#4A5FA0" strokeWidth="1.5" />
      <ellipse cx="40" cy="40" rx="37" ry="15" stroke="#4A5FA0" strokeWidth="1.5" />
      <ellipse cx="40" cy="40" rx="15" ry="37" stroke="#4A5FA0" strokeWidth="1.5" />
      <line x1="3" y1="40" x2="77" y2="40" stroke="#4A5FA0" strokeWidth="1.5" />
      <line x1="40" y1="3" x2="40" y2="77" stroke="#4A5FA0" strokeWidth="1.5" />
    </svg>
  );
}

export default function LangScreen({ languages, onBack }) {
  const [expanded, setExpanded] = useState(false);
  const [tappedLabel, setTappedLabel] = useState(null);

  const primary = LANG_ORDER.map((label) => languages.find((l) => l.label === label)).filter(Boolean);
  const primaryLabels = primary.map((l) => l.label);
  const rest = languages.filter((l) => !primaryLabels.includes(l.label));

  function handleTap(lang) {
    if (tappedLabel === lang.label) {
      lang.select();
    } else {
      setTappedLabel(lang.label);
    }
  }

  function renderRow(lang, i) {
    const isSelected = tappedLabel === lang.label;
    return (
      <div
        key={lang.label + i}
        className={`flex items-center gap-3 px-[16px] py-[14px] rounded-[18px] cursor-pointer transition-colors ${
          isSelected
            ? 'bg-[#EAF0FE] border-[1.5px] border-[#4C63D2]'
            : 'bg-[#F7F8FC] border-[1.5px] border-transparent shadow-[0_2px_10px_rgba(30,42,120,0.06)]'
        }`}
        onClick={() => handleTap(lang)}
      >
        <span
          className="w-[36px] h-[36px] rounded-full bg-[#EEF0F5] text-[16px] flex items-center justify-center flex-shrink-0 cursor-pointer"
          onClick={lang.speak}
        >
          🔊
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold text-[#1A237E] truncate">{lang.label}</div>
          <div className="text-[11px] text-[#9CA3AF] mt-[1px] truncate">{lang.hint}</div>
        </div>
        {isSelected ? (
          <span className="w-[22px] h-[22px] rounded-full bg-[#4C63D2] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
            ✓
          </span>
        ) : (
          <span className="text-[18px] text-[#9CA3AF] flex-shrink-0">›</span>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col flex-1"
      style={{ background: '#D7E0F5' }}
    >
      <div className="flex items-center px-5 pt-[26px]">
        <button
          className="flex items-center justify-center text-[#1A237E] bg-transparent border-none cursor-pointer"
          onClick={onBack}
          aria-label="Back"
        >
          <BackArrowIcon />
        </button>
      </div>

      <div className="flex flex-col items-center pt-[36px] pb-[16px]">
        <GlobeIcon />
      </div>

      <div className="flex flex-col flex-1 mx-auto mb-[14px] w-[85%] bg-white rounded-[28px] shadow-[0_8px_24px_rgba(26,35,126,0.14)] overflow-hidden">
        <div className="flex flex-col items-center pt-[24px] pb-[18px] px-[18px]">
          <div className="text-[20px] font-bold text-[#1A237E] text-center">Choose Language</div>
          <div className="text-[13px] text-[#9E9E9E] mt-1 text-center">Select your preferred language</div>
        </div>

        <div className="flex flex-col gap-[14px] px-[18px]">
          {primary.map((lang, i) => renderRow(lang, i))}

          <button
            className="text-[13px] text-[#9E9E9E] font-medium text-center bg-transparent border-none cursor-pointer py-[6px]"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Less ▴' : 'More ▾'}
          </button>

          {expanded && (
            <div className="flex flex-col gap-[14px]">{rest.map((lang, i) => renderRow(lang, i))}</div>
          )}
        </div>

        <div className="flex-1" />
        <div className="text-[12px] text-[#4A5FA0] text-center pb-[22px] pt-[16px]">
          Tap speaker for Audio Explanation
        </div>
      </div>
    </div>
  );
}
