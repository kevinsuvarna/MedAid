import { useState } from 'react';

const LANG_ORDER = ['English', 'हिन्दी', 'తెలుగు', 'ಕನ್ನಡ'];

function GlobeIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="37" stroke="#1A237E" strokeWidth="1.5" />
      <ellipse cx="40" cy="40" rx="37" ry="15" stroke="#1A237E" strokeWidth="1.5" />
      <ellipse cx="40" cy="40" rx="15" ry="37" stroke="#1A237E" strokeWidth="1.5" />
      <line x1="3" y1="40" x2="77" y2="40" stroke="#1A237E" strokeWidth="1.5" />
      <line x1="40" y1="3" x2="40" y2="77" stroke="#1A237E" strokeWidth="1.5" />
    </svg>
  );
}

export default function LangScreen({ languages }) {
  const [expanded, setExpanded] = useState(false);
  const [tappedLabel, setTappedLabel] = useState(null);

  const primary = LANG_ORDER.map((label) => languages.find((l) => l.label === label)).filter(Boolean);
  const primaryLabels = primary.map((l) => l.label);
  const rest = languages.filter((l) => !primaryLabels.includes(l.label));

  function renderRow(lang, i) {
    const isSelected = tappedLabel === lang.label;
    return (
      <div
        key={lang.label + i}
        className={`flex items-center gap-3 h-[44px] px-[18px] cursor-pointer ${
          isSelected
            ? 'bg-[#E8EAF6] border-[1.5px] border-[#3949AB] rounded-[12px]'
            : 'bg-white border-b border-[#EEEEEE]'
        }`}
        onClick={() => {
          setTappedLabel(lang.label);
          lang.select();
        }}
      >
        <span className="text-[20px] text-[#9CA3AF] flex-shrink-0 cursor-pointer" onClick={lang.speak}>
          🔊
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold text-[#1A237E] truncate">{lang.label}</div>
          <div className="text-[11px] text-[#9CA3AF] mt-[1px] truncate">{lang.hint}</div>
        </div>
        {isSelected ? (
          <span className="w-[22px] h-[22px] rounded-full bg-[#3949AB] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
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
      className="flex flex-col flex-1 relative"
      style={{ animation: 'fadeIn 0.3s ease', background: 'linear-gradient(180deg, #E8EAF6 0%, #C5CAE9 100%)' }}
    >
      <button
        className="absolute top-[18px] left-[18px] text-[22px] leading-none text-[#1A237E] bg-transparent border-none cursor-pointer z-10"
        aria-label="Back"
      >
        ←
      </button>

      <div className="flex flex-col items-center pt-[54px] pb-[18px]">
        <GlobeIcon />
      </div>

      <div className="flex flex-col mx-auto w-[85%] bg-white rounded-[24px] shadow-[0_8px_24px_rgba(26,35,126,0.14)] overflow-hidden">
        <div className="flex flex-col items-center pt-[22px] pb-[16px] px-[18px]">
          <div className="text-[20px] font-bold text-[#1A237E] text-center">Choose Language</div>
          <div className="text-[13px] text-[#9E9E9E] mt-1 text-center">Select your preferred language</div>
        </div>

        <div className="flex flex-col">
          {primary.map((lang, i) => renderRow(lang, i))}

          <button
            className="text-[13px] text-[#9E9E9E] font-medium text-center bg-transparent border-none cursor-pointer py-[14px]"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Less ▴' : 'More ▾'}
          </button>

          {expanded && <div className="flex flex-col">{rest.map((lang, i) => renderRow(lang, i))}</div>}
        </div>
      </div>

      <div className="flex-1" />
      <div className="text-[12px] text-[#3949AB] text-center pb-[22px] pt-[16px]">
        Audio explanation of your report
      </div>
    </div>
  );
}
