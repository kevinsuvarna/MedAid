export default function AskScreen({
  t,
  askOptions,
  showAskTranscript,
  askTranscript,
  onAskTranscriptChange,
  askVoiceUnavailable,
}) {
  return (
    <div className="flex flex-col flex-1 pt-4 px-[22px] pb-[22px]">
      <div className="text-[19px] font-extrabold text-[#1A1A2E]">{t.askTitle}</div>
      <div className="text-[14px] text-[#9CA3AF] mt-[6px] font-medium">{t.askSubtitle}</div>

      <div className="flex flex-col gap-3 mt-[22px]">
        {askOptions.filter((opt) => opt.label !== t.askOwnWords).map((opt, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-white rounded-[18px] px-[18px] py-4 cursor-pointer"
            style={{ boxShadow: opt.shadow, border: opt.border }}
            onClick={opt.onClick}
          >
            <span className="text-[19px]">{opt.icon}</span>
            <span className="flex-1 text-[15px] font-bold text-[#1A1A2E]">{opt.label}</span>
            {opt.showSpeaker && (
              <div
                className="w-9 h-9 rounded-full bg-[#FBE4DA] flex items-center justify-center flex-shrink-0"
                onClick={opt.speak}
              >
                <span className="text-[15px]">🔊</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAskTranscript && (
        <div className="mt-4">
          <input
            type="text"
            value={askTranscript}
            onChange={onAskTranscriptChange}
            placeholder={t.askListeningLabel}
            className="w-full bg-white border-[1.5px] border-[#F0DCD3] rounded-2xl px-4 py-[14px] text-[14px] text-[#1A1A2E] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          />
        </div>
      )}

      {askVoiceUnavailable && (
        <div className="mt-[14px] text-center text-[13px] text-[#9CA3AF] font-semibold">{t.askVoiceUnavailableMsg}</div>
      )}

      <div className="flex-1" />
    </div>
  );
}
