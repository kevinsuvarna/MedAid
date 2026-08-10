import { useEffect, useRef, useState } from 'react';
import { tierForGroup } from '@/lib/reportAdapter';
import { speak, stopSpeech } from '@/lib/speech';

const SUMMARY_CELLS = [
  { id: 'rbc', label1: 'O2 Levels:' },
  { id: 'wbc', label1: 'Defense:' },
  { id: 'plt', label1: 'Clotting:' },
];

function statusLabelFor(tier) {
  if (tier === 'green') return 'All Good';
  if (tier === 'amber') return 'Needs Care';
  return 'Needs Attention';
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#2E7D32" />
      <path d="M7 12.5L10.5 16L17 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function OpeningScreen({
  t,
  reportData,
  exploreReport,
  audioMode,
  enableAudioMode,
  langCode,
  languageLabel,
  onBack,
  onLanguageClick,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isFirstRender = useRef(true);

  const cellTiers = SUMMARY_CELLS.map((cell) => ({ ...cell, tier: tierForGroup(reportData, cell.id) }));

  const narrationText = cellTiers.map((cell) => `${cell.label1} ${statusLabelFor(cell.tier)}`).join('. ');

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!audioMode) return;
    setIsPlaying(true);
    speak(narrationText, langCode, () => setIsPlaying(false));
    return () => stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioMode]);

  useEffect(() => () => stopSpeech(), []);

  function handleTogglePlay() {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speak(narrationText, langCode, () => setIsPlaying(false));
    }
  }

  function handleDownload() {
    window.print();
  }

  const reportSubtitle = 'Complete Blood Count';
  const patientDate = reportData && reportData.patient ? reportData.patient.date : null;
  const reportDateTime = [patientDate, '09:30 AM'].filter(Boolean).join(' • ');

  return (
    <div
      className="flex flex-col flex-1 relative"
      style={{ animation: 'fadeIn 0.3s ease', background: '#D7E0F5' }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #opening-summary-card, #opening-summary-card * { visibility: visible; }
          #opening-summary-card { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="flex items-center justify-between px-5 pt-[26px]">
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
          <span className="text-[13px] text-[#1A237E]">🔊</span>
          <span className="text-[12px] font-bold text-[#1A237E]">{languageLabel}</span>
        </div>
      </div>

      <div className="relative flex flex-col items-center pt-4 pb-2">
        <div className="relative w-[140px] h-[140px]">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] rounded-full"
            style={{ border: '1.5px solid rgba(74,95,160,0.22)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[104px] h-[104px] rounded-full"
            style={{ border: '1.5px solid rgba(74,95,160,0.38)' }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[64px] h-[64px] rounded-full bg-white flex items-center justify-center shadow-[0_8px_20px_rgba(26,35,126,0.18)]">
            <svg width="32" height="22" viewBox="0 0 60 40" fill="none">
              <polyline
                points="2,20 14,20 20,6 28,34 36,10 42,20 58,20"
                fill="none"
                stroke="#1A237E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <svg className="w-full pointer-events-none" height="28" viewBox="0 0 390 28" preserveAspectRatio="none">
        <path
          d="M0,14 C32.5,-2 65,-2 97.5,14 C130,30 162.5,30 195,14 C227.5,-2 260,-2 292.5,14 C325,30 357.5,30 390,14"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>

      <div
        id="opening-summary-card"
        className="relative flex flex-col flex-1 mx-auto mb-[14px] w-[90%] bg-white rounded-[24px] shadow-[0_8px_24px_rgba(26,35,126,0.14)] px-5 pt-6 pb-5 overflow-y-auto"
      >
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-[6px] bg-[#E8F5E9] text-[#2E7D32] text-[12px] font-bold rounded-full px-3 py-[6px]">
            <CheckCircleIcon />
            <span>NFC DETECTED</span>
          </div>
        </div>

        <div className="text-[22px] font-extrabold text-[#1A237E] text-center mt-4">Medical Report Found</div>
        <div className="text-[13px] text-[#9CA3AF] text-center mt-1">
          We found a report linked to this NFC tag.
        </div>

        <div className="border-t border-[#EEEEEE] my-5" />

        <div className="flex items-center gap-3 bg-[#F7F8FC] rounded-[16px] px-4 py-3">
          <div className="w-[44px] h-[44px] rounded-[12px] bg-white border-[1.5px] border-[#C7D3F0] flex items-center justify-center flex-shrink-0">
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
              <path d="M3 1H13L17 5V23H3V1Z" stroke="#4C63D2" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M13 1V5H17" stroke="#4C63D2" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="6" y1="11" x2="14" y2="11" stroke="#4C63D2" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="15" x2="14" y2="15" stroke="#4C63D2" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="19" x2="11" y2="19" stroke="#4C63D2" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-extrabold text-[#1A237E]">CBC Blood Test</div>
            <div className="text-[12px] text-[#9CA3AF] mt-[1px]">{reportSubtitle}</div>
            <div className="text-[12px] text-[#9CA3AF]">{reportDateTime}</div>
          </div>
        </div>

        <div className="flex-1 min-h-4" />

        <button
          className="w-full bg-[#1A237E] text-white border-none rounded-[30px] h-[54px] text-[15px] font-bold uppercase tracking-[0.04em] cursor-pointer mt-6"
          onClick={exploreReport}
        >
          Check Report →
        </button>

        {audioMode ? (
          <div className="mt-4">
            <div className="bg-[#F7F8FC] rounded-full shadow-[0_4px_16px_rgba(26,35,126,0.08)] flex items-center gap-3 px-4 py-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer text-white"
                style={{ background: '#1A237E' }}
                onClick={handleTogglePlay}
              >
                <span className="text-[14px]">{isPlaying ? '⏸' : '▶'}</span>
              </div>
              <div className="flex items-center gap-[2px] flex-1 justify-center h-5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[2px] bg-[#1A237E] rounded-full"
                    style={{
                      height: `${8 + (i % 5) * 3}px`,
                      animation: isPlaying ? `pulseScale 0.9s ease-in-out ${(i % 6) * 0.08}s infinite` : 'none',
                    }}
                  />
                ))}
              </div>
              <span className="text-[12px] text-[#9CA3AF] font-semibold flex-shrink-0">1x</span>
            </div>
            <div className="text-[12px] text-[#5C6BC0] text-center mt-2">Listening to My Report (Narrated)</div>
          </div>
        ) : (
          <button
            className="w-full bg-white text-[#1A237E] border-[1.5px] border-[#C7D3F0] rounded-[27px] h-[48px] text-[14px] font-bold cursor-pointer mt-4"
            onClick={enableAudioMode}
          >
            🔊 {t.listenCta}
          </button>
        )}

        <button
          className="bg-transparent text-[#7C86B8] text-[13px] font-semibold text-center cursor-pointer border-none mt-3"
          onClick={handleDownload}
        >
          ⬇ Download as PDF
        </button>

        <div className="text-[12px] text-[#9CA3AF] text-center mt-4">No personal data is stored on this tag.</div>
      </div>
    </div>
  );
}
