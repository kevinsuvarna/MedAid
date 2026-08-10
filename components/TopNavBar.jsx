import BackArrowIcon from '@/components/icons/BackArrowIcon';

export default function TopNavBar({ onBack, languageLabel, onLanguageClick }) {
  return (
    <div className="flex-shrink-0 bg-white flex items-end justify-between px-4 pt-[26px] pb-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <button
        className="flex items-center justify-center text-[#1A237E] bg-transparent border-none cursor-pointer px-1 py-1"
        onClick={onBack}
        aria-label="Back"
      >
        <BackArrowIcon />
      </button>
      <div
        className="flex items-center gap-[6px] bg-[#EEF1FA] rounded-full px-3 py-[6px] cursor-pointer"
        onClick={onLanguageClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/audio_follow.svg" alt="" style={{ width: 16.9, height: 15.8 }} />
        <span className="text-[12px] font-bold text-[#3949AB]">{languageLabel}</span>
      </div>
    </div>
  );
}
