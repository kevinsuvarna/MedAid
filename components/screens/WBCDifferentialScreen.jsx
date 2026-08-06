import WBCDonutChart from '@/components/icons/WBCDonutChart';

export default function WBCDifferentialScreen({
  backToResult,
  t,
  segments,
  centerLabel,
  abnormalRows,
  feedbackGiven,
  giveFeedback,
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pt-4 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex items-center gap-[10px]">
        <div className="text-[24px] text-[#6B7280] cursor-pointer p-1" onClick={backToResult}>‹</div>
        <div className="text-[19px] font-extrabold text-[#1A1A2E]">{t.wbcDiffTitle}</div>
      </div>
      <div className="text-[14px] text-[#9CA3AF] mt-[6px] ml-[38px] font-medium">{t.wbcDiffSubtitle}</div>

      <div className="flex justify-center items-center mt-5 py-4 rounded-[20px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <WBCDonutChart segments={segments} centerLabel={centerLabel} />
      </div>

      <div className="text-[14.5px] font-bold text-[#1A1A2E] mt-5 mb-3">{t.wbcDiffOutsideRange}</div>
      <div className="flex flex-col gap-[10px]">
        {abnormalRows.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-3 rounded-[16px] px-4 py-[14px]"
            style={{ background: row.bg, border: `1.5px solid ${row.color}` }}
          >
            <span className="text-[16px]">{row.dot}</span>
            <span className="flex-1 text-[13.5px] font-semibold" style={{ color: row.color }}>
              {row.name} — {row.valueLine} — {row.rangeLine}
            </span>
          </div>
        ))}
      </div>

      {!feedbackGiven && (
        <div className="flex items-center justify-center gap-[14px] mt-5">
          <span className="text-[13.5px] text-[#6B7280] font-semibold">{t.feedbackQuestion}</span>
          <span className="text-[19px] cursor-pointer" onClick={giveFeedback}>👍</span>
          <span className="text-[19px] cursor-pointer" onClick={giveFeedback}>👎</span>
        </div>
      )}
      {feedbackGiven && (
        <div className="text-center text-[13.5px] text-[#27AE60] font-bold mt-5">{t.feedbackThanks}</div>
      )}
    </div>
  );
}
