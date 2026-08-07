export default function TopNavBar({ onBack, languageLabel, onLanguageClick }) {
  return (
    <div className="h-12 flex-shrink-0 bg-white flex items-center justify-between px-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <button
        className="flex items-center gap-1 text-[14px] font-semibold text-[#1A1A2E] bg-transparent border-none cursor-pointer px-1 py-1"
        onClick={onBack}
      >
        ← Back
      </button>
      <div
        className="flex items-center gap-[6px] bg-[#FBE4DA] rounded-full px-3 py-[6px] cursor-pointer"
        onClick={onLanguageClick}
      >
        <span className="text-[13px] text-[#C0392B]">🔊</span>
        <span className="text-[12px] font-bold text-[#C0392B]">{languageLabel}</span>
      </div>
    </div>
  );
}
