export default function FollowUpsScreen({ backToAsk, t, sections }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pt-4 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex items-center gap-[10px]">
        <div className="text-[24px] text-[#6B7280] cursor-pointer p-1" onClick={backToAsk}>‹</div>
        <div className="text-[19px] font-extrabold text-[#1A1A2E]">{t.followUpsTitle}</div>
      </div>

      <div className="flex flex-col gap-4 mt-5">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-[18px] p-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-[10px]">
              <span className="text-[20px]">{section.icon}</span>
              <span className="flex-1 text-[15.5px] font-bold text-[#1A1A2E]">{section.heading}</span>
              <div
                className="w-8 h-8 rounded-full bg-[#FBE4DA] flex items-center justify-center flex-shrink-0 cursor-pointer"
                onClick={section.speak}
              >
                <span className="text-[13px]">🔊</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {section.items.map((item, i) => (
                <div
                  key={i}
                  className="bg-[#FDF6F0] rounded-[12px] px-3 py-[10px] text-[13.5px] text-[#1A1A2E] font-medium leading-[1.5]"
                >
                  {item}
                </div>
              ))}
            </div>
            {section.disclaimer && (
              <div className="text-[12px] text-[#9CA3AF] font-medium mt-3">{section.disclaimer}</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <button className="w-full bg-[#F9F3EF] text-[#9E8A7D] border-[1.5px] border-[#F0DCD3] rounded-2xl p-[15px] text-[13.5px] font-bold cursor-default">
          {t.explanationDoctorCta}
        </button>
      </div>
    </div>
  );
}
