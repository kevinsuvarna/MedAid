import CheckmarkIcon from '@/components/icons/CheckmarkIcon';

export default function SavedScreen({ t, exploreAnotherPart, savedCategoryCards }) {
  return (
    <div
      className="flex flex-col flex-1 pt-5 px-[22px] pb-[22px] items-center justify-center text-center"
      style={{ animation: 'fadeIn 0.3s ease' }}
    >
      <div
        className="w-24 h-24 rounded-full bg-[#E9F7EF] flex items-center justify-center"
        style={{ animation: 'savedPop 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <CheckmarkIcon />
      </div>
      <div className="text-[24px] font-extrabold text-[#1A1A2E] mt-5">{t.savedHeading}</div>
      <div className="text-[14.5px] text-[#6B7280] mt-2 max-w-[260px] font-medium leading-[1.5]">{t.savedBody}</div>

      <div className="w-full mt-7">
        <button
          className="w-full bg-[#C0392B] text-white border-none rounded-[27px] p-4 text-[16px] font-bold cursor-pointer min-h-[54px] shadow-[0_6px_18px_rgba(192,57,43,0.32)]"
          onClick={exploreAnotherPart}
        >
          {t.exploreAnotherCta}
        </button>
      </div>

      <div className="flex gap-[10px] w-full mt-4">
        {savedCategoryCards.map((card, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-[6px] rounded-2xl px-2 py-[14px] cursor-pointer"
            style={{ background: card.bg }}
            onClick={card.select}
          >
            <span className="text-[20px]">{card.icon}</span>
            <span className="text-[11.5px] font-bold text-center" style={{ color: card.accent }}>{card.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
