import { useState } from 'react';
import HeartbeatIcon from '@/components/icons/HeartbeatIcon';

export default function LangScreen({ languages }) {
  const [expanded, setExpanded] = useState(false);

  const cards = languages.map((lang, i) => (
    <div
      key={i}
      className="flex items-center gap-[14px] bg-white rounded-[20px] px-[18px] py-[18px] cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      onClick={lang.select}
    >
      <div
        className="w-[46px] h-[46px] rounded-full bg-[#FBE4DA] flex items-center justify-center flex-shrink-0 cursor-pointer"
        onClick={lang.speak}
      >
        <span className="text-[19px]">🔊</span>
      </div>
      <div className="flex-1">
        <div className="text-[18px] font-bold text-[#1A1A2E]">{lang.label}</div>
        <div className="text-[13px] text-[#9CA3AF] mt-[2px]">{lang.hint}</div>
      </div>
      <div className="text-[20px] text-[#C0392B] font-bold">→</div>
    </div>
  ));

  return (
    <div className="flex flex-col flex-1 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex flex-col items-center bg-[linear-gradient(180deg,#FBE4DA_0%,#FDF6F0_100%)] pt-[30px] pb-[22px] -mx-[22px] mb-[20px]">
        <HeartbeatIcon />
        <div className="text-[13px] font-bold text-[#C0392B] tracking-[0.08em] uppercase mt-[10px]">Step 1 of 5</div>
      </div>

      <div className="text-[25px] font-extrabold text-[#1A1A2E] mb-1">Choose your language</div>
      <div className="text-[14px] text-[#9CA3AF] mb-[22px]">You can change this anytime</div>

      <div className="flex flex-col gap-[14px]">{cards.slice(0, 3)}</div>

      <button
        className="mt-[18px] text-[14px] text-[#9CA3AF] font-semibold text-center bg-transparent border-none cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Less ▴' : 'More ▾'}
      </button>

      {expanded && <div className="flex flex-col gap-[14px] mt-[14px]">{cards.slice(3)}</div>}

      <div className="flex-1" />
      <div className="text-center text-[12px] text-[#B0A9A2] mt-[14px]">Your report is private and secure</div>
    </div>
  );
}
