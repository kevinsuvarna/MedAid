import ConceptIcon from '@/components/icons/ConceptIcon';

export default function ConceptScreen({
  backToOverview,
  currentCategoryName,
  currentCategoryBg,
  category,
  currentCategoryDesc,
  speakConceptDesc,
  t,
  goToResult,
}) {
  return (
    <div className="flex flex-col flex-1 pt-4 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex items-center gap-[10px]">
        <div className="text-[24px] text-[#6B7280] cursor-pointer p-1" onClick={backToOverview}>‹</div>
        <div className="text-[19px] font-extrabold text-[#1A1A2E]">{currentCategoryName}</div>
      </div>

      <div
        className="flex justify-center items-center mt-4 h-[230px] rounded-[26px] overflow-hidden"
        style={{ background: currentCategoryBg }}
      >
        <ConceptIcon category={category} />
      </div>

      <div className="text-center text-[16.5px] text-[#1A1A2E] font-semibold mt-6 leading-[1.55] px-[6px]">
        {currentCategoryDesc}
      </div>

      <div className="flex justify-center mt-[18px]">
        <button
          className="bg-white border-[1.5px] border-[#F0DCD3] rounded-2xl px-5 py-3 text-[14px] font-bold text-[#C0392B] cursor-pointer flex items-center gap-[6px] shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          onClick={speakConceptDesc}
        >
          🔊 {t.listen}
        </button>
      </div>

      <div className="flex-1" />
      <button
        className="bg-[#C0392B] text-white border-none rounded-[27px] p-4 text-[16px] font-bold cursor-pointer min-h-[54px] shadow-[0_6px_18px_rgba(192,57,43,0.32)]"
        onClick={goToResult}
      >
        {t.seeResult}
      </button>
    </div>
  );
}
