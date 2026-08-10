import { voiceCodeFor, SpeakerIcon } from '@/components/screens/WBCConceptScreen';
import { speak } from '@/lib/speech';

export default function FollowUpsScreen({
  t,
  sections,
  onBack,
  onLanguageClick,
  languageLabel,
  langCode,
  goToAskMyDoc,
}) {
  function speakAll() {
    const text = [t.followUpsTitle, ...sections.flatMap((s) => [s.heading, ...s.items])].join('. ');
    speak(text, langCode);
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-y-auto pb-[22px]"
      style={{ animation: 'fadeIn 0.3s ease', background: 'linear-gradient(160deg, #E4E9FA 0%, #F1EEFB 45%, #FDF6F0 100%)' }}
    >
      <div className="flex items-center justify-between px-[22px] pt-[26px]">
        <button
          className="text-[20px] leading-none text-[#1A237E] bg-transparent border-none cursor-pointer"
          onClick={onBack}
          aria-label="Back"
        >
          ←
        </button>
        <div
          className="flex items-center gap-[6px] bg-white rounded-full px-3 py-[6px] cursor-pointer shadow-[0_4px_12px_rgba(26,35,126,0.12)]"
          onClick={onLanguageClick}
        >
          <span className="text-[12px] font-bold text-[#1A237E]">Voice: {voiceCodeFor(languageLabel)}</span>
        </div>
      </div>

      <div
        className="rounded-[26px] p-[18px] mt-4 mx-[22px]"
        style={{
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 8px 30px rgba(30,40,90,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[20px] font-bold text-[#1A237E]">{t.followUpsTitle}</div>
          <button
            className="w-8 h-8 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)] flex items-center justify-center flex-shrink-0 cursor-pointer border-none"
            onClick={speakAll}
            aria-label={t.listen}
          >
            <SpeakerIcon />
          </button>
        </div>

        {sections.map((section) => (
          <div key={section.id} className="mt-[18px]">
            <div className="flex items-center gap-2 mb-[10px]">
              <span className="text-[15px]">{section.icon}</span>
              <span className="text-[14px] font-bold text-[#1A237E]">{section.heading}</span>
            </div>
            <div className="flex flex-col gap-2">
              {section.items.map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-[14px] shadow-[0_3px_10px_rgba(30,40,90,0.06)] px-4 py-[13px] text-[13.5px] leading-[1.4] text-[#333952]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="text-[12px] text-[#7A7F94] mt-[18px] mb-5">{t.followUpsDisclaimer}</div>

        <div className="text-[16px] font-bold text-[#1A237E] mb-3">{t.askMyDocHeading}</div>

        <div
          className="flex items-center gap-3 bg-white rounded-[16px] shadow-[0_3px_10px_rgba(30,40,90,0.06)] px-4 py-[13px] cursor-pointer"
          onClick={goToAskMyDoc}
        >
          <div
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[16px] text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7B85D9 0%, #5A62C6 100%)' }}
          >
            💬
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-bold text-[#1A237E]">{t.askMyDocTitle}</div>
            <div className="text-[12px] text-[#7A7F94] mt-[2px]">{t.askMyDocSubtitle}</div>
          </div>
          <div className="text-[16px] text-[#9CA3AF]">›</div>
        </div>
      </div>
    </div>
  );
}
