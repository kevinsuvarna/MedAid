import ExplanationDiagram from '@/components/icons/ExplanationDiagram';

export default function ExplanationScreen({
  t,
  explanationParamLabel,
  explanationFacts,
  category,
  langId,
  feedbackGiven,
  giveFeedback,
}) {
  return (
    <div className="flex flex-col flex-1 pt-4 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="text-[19px] font-extrabold text-[#1A1A2E]">{t.explanationTitle}</div>
      <div className="text-[14.5px] text-[#6B7280] mt-[6px] font-bold">{explanationParamLabel}</div>

      <div className="flex flex-col gap-3 mt-5">
        {explanationFacts.map((fact, i) => (
          <div key={i} className="flex items-start gap-[14px] bg-white rounded-[18px] px-[18px] py-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <span className="text-[20px] flex-shrink-0">{fact.icon}</span>
            <span className="text-[14.5px] text-[#1A1A2E] font-semibold leading-[1.5]">{fact.text}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center mt-[18px] px-2 py-[18px] rounded-[20px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <ExplanationDiagram category={category} langId={langId} />
      </div>

      <div className="mt-5">
        <button className="w-full bg-[#F9F3EF] text-[#9E8A7D] border-[1.5px] border-[#F0DCD3] rounded-2xl p-[15px] text-[13.5px] font-bold cursor-default">
          {t.explanationDoctorCta}
        </button>
      </div>

      {!feedbackGiven && (
        <div className="flex items-center justify-center gap-[14px] mt-[18px]">
          <span className="text-[13.5px] text-[#6B7280] font-semibold">{t.feedbackQuestion}</span>
          <span className="text-[19px] cursor-pointer" onClick={giveFeedback}>👍</span>
          <span className="text-[19px] cursor-pointer" onClick={giveFeedback}>👎</span>
        </div>
      )}
      {feedbackGiven && (
        <div className="text-center text-[13.5px] text-[#27AE60] font-bold mt-[18px]">{t.feedbackThanks}</div>
      )}

      <div className="flex-1" />
    </div>
  );
}
