import { useEffect, useRef, useState } from 'react';
import { PARAMS, WBC_DIFFERENTIAL } from '@/lib/data';
import { speak, stopSpeech } from '@/lib/speech';

const SUMMARY_CELLS = [
  { id: 'rbc', icon: '🩸', label1: 'O2 Levels:' },
  { id: 'wbc', icon: '🛡️', label1: 'Defense:' },
  { id: 'plt', icon: '🩹', label1: 'Clotting:' },
];

function tierFor(id) {
  if (id === 'wbc') {
    return WBC_DIFFERENTIAL.some((seg) => seg.flag !== 'within') ? 'amber' : 'green';
  }
  return PARAMS[id].flag === 'within' ? 'green' : 'amber';
}

function statusLabelFor(tier) {
  if (tier === 'green') return 'All Good';
  if (tier === 'amber') return 'Needs Care';
  return 'Needs Attention';
}

function badgeColorFor(tier) {
  if (tier === 'green') return '#4CAF50';
  if (tier === 'amber') return '#FFC107';
  return '#F44336';
}

function badgeIconFor(tier) {
  return tier === 'green' ? '✓' : '⚠';
}

export default function OpeningScreen({
  t,
  patientReportLabel,
  exploreReport,
  audioMode,
  enableAudioMode,
  langCode,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isFirstRender = useRef(true);

  const cellTiers = SUMMARY_CELLS.map((cell) => ({ ...cell, tier: tierFor(cell.id) }));

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

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-y-auto pt-5 px-[22px] pb-[22px]"
      style={{ animation: 'fadeIn 0.3s ease' }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #opening-summary-card, #opening-summary-card * { visibility: visible; }
          #opening-summary-card { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="w-[90px] h-[90px] rounded-full bg-[#FDDCCC] flex items-center justify-center mx-auto">
        <svg width={54} height={54} viewBox="0 0 72 72">
          <circle cx={36} cy={28} r={16} fill="#8C4A2E" />
          <path d="M14 68 C14 46 24 40 36 40 C48 40 58 46 58 68 Z" fill="#3B4A6B" />
          <circle cx={30} cy={27} r={2} fill="#2B1710" />
          <circle cx={42} cy={27} r={2} fill="#2B1710" />
          <path d="M29 34 Q36 39 43 34" stroke="#2B1710" strokeWidth={2} fill="none" strokeLinecap="round" />
        </svg>
      </div>

      <div className="text-[26px] font-extrabold text-[#1A1A2E] text-center mt-4">{t.greeting}</div>
      <div className="text-[15px] text-[#6B7280] font-medium text-center mt-2 max-w-[280px] mx-auto leading-[1.4]">
        {t.openingLine}
      </div>

      <div id="opening-summary-card" className="bg-[#F5EDE3] rounded-[20px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] mt-6">
        <div className="text-[15px] font-bold text-[#1A1A2E]">{patientReportLabel}</div>
        <div className="text-[13px] text-[#9CA3AF] mt-1">{t.reportMeta}</div>

        <div className="border-t border-[#E0D5C7] my-4" />

        <div className="text-[15px] font-bold text-[#1A1A2E] mb-3">Quick Summary</div>

        <div className="flex gap-2">
          {cellTiers.map((cell) => (
            <div key={cell.id} className="flex-1 flex flex-col items-center text-center gap-1">
              <div className="relative">
                <span className="text-[32px]">{cell.icon}</span>
                <span
                  className="absolute -top-1 -right-1 w-[16px] h-[16px] rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: badgeColorFor(cell.tier) }}
                >
                  {badgeIconFor(cell.tier)}
                </span>
              </div>
              <div className="text-[11.5px] font-semibold text-[#1A1A2E] leading-tight mt-1">{cell.label1}</div>
              <div className="text-[11.5px] font-semibold leading-tight" style={{ color: badgeColorFor(cell.tier) }}>
                {statusLabelFor(cell.tier)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        className="bg-[#E8735A] text-white border-none rounded-[26px] p-4 text-[16px] font-bold cursor-pointer min-h-[54px] shadow-[0_6px_18px_rgba(232,115,90,0.32)] mt-6"
        onClick={exploreReport}
      >
        🖐 Tap to Explore Detailed Report
      </button>

      {audioMode ? (
        <div className="mt-4">
          <div className="bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center gap-3 px-4 py-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer text-white"
              style={{ background: '#E8735A' }}
              onClick={handleTogglePlay}
            >
              <span className="text-[14px]">{isPlaying ? '⏸' : '▶'}</span>
            </div>
            <div className="flex items-center gap-[2px] flex-1 justify-center h-5">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] bg-[#E8735A] rounded-full"
                  style={{
                    height: `${8 + (i % 5) * 3}px`,
                    animation: isPlaying ? `pulseScale 0.9s ease-in-out ${(i % 6) * 0.08}s infinite` : 'none',
                  }}
                />
              ))}
            </div>
            <span className="text-[12px] text-[#9CA3AF] font-semibold flex-shrink-0">1x</span>
          </div>
          <div className="text-[12px] text-[#9CA3AF] text-center mt-2">Listening to My Report (Narrated)</div>
        </div>
      ) : (
        <button
          className="bg-white text-[#C0392B] border-[1.5px] border-[#F0DCD3] rounded-[27px] p-4 text-[16px] font-bold cursor-pointer min-h-[54px] mt-3"
          onClick={enableAudioMode}
        >
          🔊 {t.listenCta}
        </button>
      )}

      <button
        className="bg-transparent text-[#9CA3AF] text-[13px] font-semibold text-center cursor-pointer border-none mt-3"
        onClick={handleDownload}
      >
        ⬇ Download as PDF
      </button>
    </div>
  );
}
