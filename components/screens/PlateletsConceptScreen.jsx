import { useEffect } from 'react';
import { getParam } from '@/lib/reportAdapter';
import { speak, stopSpeech } from '@/lib/speech';
import { USE_MOCK } from '@/lib/config';
import { GaugeBar, SpeakerIcon } from '@/components/screens/WBCConceptScreen';

function PlateletAvatar() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/platelet.svg"
      alt=""
      className="w-[46px] h-[46px] rounded-full flex-shrink-0 shadow-[0_3px_8px_rgba(255,179,0,0.3)]"
    />
  );
}

const TOTAL_PLATELET_GAUGE = {
  min: 0,
  max: 600000,
  healthyLow: 150000,
  healthyHigh: 410000,
  lowLabel: 'LOW (0)',
  healthyLabel: 'HEALTHY (150000–410000)',
  highLabel: 'HIGH (600000)',
};

const PLATELET_STATUS_TEXT = {
  normal: 'Platelet Count is in normal range',
  low: 'Platelet Count is lower than normal range',
  high: 'Platelet Count is higher than normal range',
  borderline: 'Platelet Count is at the edge of normal range',
};

export default function PlateletsConceptScreen({ reportData, t, langCode, audioMode }) {
  const totalPlateletParam = getParam(reportData, 'plt', 'platelets');

  function playPlateletsSummary() {
    if (!totalPlateletParam) return;
    const statusText = PLATELET_STATUS_TEXT[totalPlateletParam.rawFlag] || PLATELET_STATUS_TEXT.normal;
    speak(`Platelets. Platelet Count: ${totalPlateletParam.value} ${totalPlateletParam.unit}. ${statusText}`, langCode);
  }

  useEffect(() => {
    if (!USE_MOCK && audioMode) playPlateletsSummary();
    return () => stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="rounded-[26px] p-[14px] mt-4 mx-[22px]"
      style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 8px 30px rgba(30,40,90,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      <div className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-5">
          <div className="flex items-center justify-between">
            <div className="text-[18px] font-bold text-[#1A237E]">Platelets</div>
            <button
              className="bg-transparent border-none cursor-pointer"
              onClick={playPlateletsSummary}
              aria-label={t.listen}
            >
              <SpeakerIcon />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <PlateletAvatar />
            <div>
              <span className="text-[28px] font-bold text-[#1A237E]">
                {totalPlateletParam ? totalPlateletParam.value : '--'}
              </span>
              <span className="text-[16px] text-[#9CA3AF] ml-1">{totalPlateletParam ? totalPlateletParam.unit : ''}</span>
            </div>
          </div>

          {totalPlateletParam && (
            <>
              <GaugeBar
                min={TOTAL_PLATELET_GAUGE.min}
                max={TOTAL_PLATELET_GAUGE.max}
                healthyLow={TOTAL_PLATELET_GAUGE.healthyLow}
                healthyHigh={TOTAL_PLATELET_GAUGE.healthyHigh}
                value={totalPlateletParam.value}
                lowLabel={TOTAL_PLATELET_GAUGE.lowLabel}
                healthyLabel={TOTAL_PLATELET_GAUGE.healthyLabel}
                highLabel={TOTAL_PLATELET_GAUGE.highLabel}
              />
              <div className="text-[13px] text-[#6B7280] italic mt-4">
                {PLATELET_STATUS_TEXT[totalPlateletParam.rawFlag] || PLATELET_STATUS_TEXT.normal}
              </div>
            </>
          )}
        </div>

        <div className="mt-6">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.08em] mb-2 px-1">
            Parameters Measured
          </div>
          <div className="bg-white rounded-[16px] shadow-[0_3px_10px_rgba(30,40,90,0.06)] p-4">
            <div className="text-[13px] text-[#6B7280] italic">No additional parameters found in this report.</div>
          </div>
        </div>

      <div className="text-[12.5px] text-[#64748B] text-center mt-6">Tap each to know more</div>
    </div>
  );
}
