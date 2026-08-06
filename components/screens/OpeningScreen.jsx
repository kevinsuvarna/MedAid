import DoctorAvatarIcon from '@/components/icons/DoctorAvatarIcon';

export default function OpeningScreen({ languageLabel, t, patientReportLabel, exploreReport, listenToReport }) {
  return (
    <div className="flex flex-col flex-1 pt-5 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex justify-end">
        <div className="text-[12px] font-bold text-[#C0392B] bg-[#FBE4DA] rounded-[10px] px-3 py-[6px]">{languageLabel}</div>
      </div>

      <div className="flex flex-col items-center text-center mt-[14px]">
        <div className="w-[112px] h-[112px] rounded-full bg-[linear-gradient(160deg,#F7D9C7,#F0B79A)] flex items-center justify-center shadow-[0_8px_24px_rgba(192,57,43,0.18)]">
          <DoctorAvatarIcon />
        </div>
        <div className="text-[24px] font-extrabold text-[#1A1A2E] mt-[18px]">{t.greeting}</div>
        <div className="text-[14.5px] text-[#6B7280] mt-[6px] max-w-[270px] font-medium">{t.openingLine}</div>
      </div>

      <div className="bg-white rounded-[20px] p-5 mt-[26px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <div className="text-[16px] font-bold text-[#1A1A2E]">{patientReportLabel}</div>
        <div className="text-[13px] text-[#9CA3AF] mt-1 font-medium">{t.reportMeta}</div>
      </div>

      <div className="flex-1" />
      <div className="flex flex-col gap-3">
        <button
          className="bg-[#C0392B] text-white border-none rounded-[27px] p-4 text-[16px] font-bold cursor-pointer min-h-[54px] shadow-[0_6px_18px_rgba(192,57,43,0.32)]"
          onClick={exploreReport}
        >
          🩸 {t.exploreCta}
        </button>
        <button
          className="bg-white text-[#C0392B] border-[1.5px] border-[#F0DCD3] rounded-[27px] p-4 text-[16px] font-bold cursor-pointer min-h-[54px]"
          onClick={listenToReport}
        >
          🔊 {t.listenCta}
        </button>
      </div>
    </div>
  );
}
