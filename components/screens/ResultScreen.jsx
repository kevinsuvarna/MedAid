export default function ResultScreen({
  backToConcept,
  flagColor,
  resultHeading,
  paramDesc,
  t,
  gaugePercent,
  flagBg,
  resultStatusLine,
  speakResultLine,
  toggleNumbers,
  numbersToggleLabel,
  showNumbers,
  paramValueLine,
  paramRangeLine,
  goToAsk,
  goToSaved,
}) {
  return (
    <div className="flex flex-col flex-1 pt-4 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex items-center gap-[10px]">
        <div className="text-[24px] text-[#6B7280] cursor-pointer p-1" onClick={backToConcept}>‹</div>
        <div className="text-[19px] font-extrabold" style={{ color: flagColor }}>{resultHeading}</div>
      </div>

      <div className="text-[14.5px] text-[#6B7280] mt-[10px] leading-[1.55] font-medium">{paramDesc}</div>

      <div className="bg-white rounded-[22px] px-5 py-6 mt-6 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex justify-between text-[12px] font-bold text-[#9CA3AF] mb-[14px]">
          <span>{t.lower}</span>
          <span>{t.higher}</span>
        </div>
        <div className="relative h-[10px] rounded-[6px] bg-[linear-gradient(90deg,#E74C3C_0%,#27AE60_50%,#F39C12_100%)]">
          <div
            className="absolute top-1/2 w-[22px] h-[22px] rounded-full border-4 border-white shadow-[0_3px_10px_rgba(0,0,0,0.25)]"
            style={{ left: `${gaugePercent}%`, transform: 'translate(-50%,-50%)', background: flagColor }}
          />
        </div>
        <div
          className="text-center text-[14.5px] font-bold rounded-[14px] p-[14px] mt-6"
          style={{ color: flagColor, background: flagBg }}
        >
          {resultStatusLine}
        </div>

        <div className="flex justify-center mt-4">
          <button
            className="bg-transparent border-[1.5px] border-[#F0DCD3] rounded-2xl px-5 py-[11px] text-[14px] font-bold text-[#C0392B] cursor-pointer flex items-center gap-[6px]"
            onClick={speakResultLine}
          >
            🔊 {t.explainThis}
          </button>
        </div>
      </div>

      <div className="mt-[18px]">
        <div
          className="flex items-center justify-between bg-white rounded-2xl px-[18px] py-4 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          onClick={toggleNumbers}
        >
          <span className="text-[14.5px] font-bold text-[#1A1A2E]">{numbersToggleLabel}</span>
        </div>
        {showNumbers && (
          <div className="bg-white rounded-2xl p-[18px] mt-[10px] flex flex-col gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between text-[14px] border-t border-[#F3EDE8] pt-0">
              <span className="text-[#6B7280] font-medium">{resultHeading}</span>
              <span className="font-bold text-[#1A1A2E]">{paramValueLine}</span>
            </div>
            <div className="flex justify-between text-[14px] border-t border-[#F3EDE8] pt-3">
              <span className="text-[#6B7280] font-medium">{t.lab}</span>
              <span className="font-bold text-[#1A1A2E]">{paramRangeLine}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />
      <div className="flex gap-3">
        <button
          className="flex-1 bg-transparent text-[#C0392B] border-[1.5px] border-[#F0DCD3] rounded-[27px] px-[10px] py-[15px] text-[14px] font-bold cursor-pointer min-h-[52px] flex items-center justify-center gap-[6px]"
          onClick={goToAsk}
        >
          💬 {t.askAboutThis}
        </button>
        <button
          className="flex-1 bg-transparent text-[#C0392B] border-[1.5px] border-[#F0DCD3] rounded-[27px] px-[10px] py-[15px] text-[14px] font-bold cursor-pointer min-h-[52px] flex items-center justify-center gap-[6px]"
          onClick={goToSaved}
        >
          🔖 {t.saveForLater}
        </button>
      </div>
    </div>
  );
}
