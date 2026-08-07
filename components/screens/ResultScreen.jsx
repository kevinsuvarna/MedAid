import { useEffect, useState } from 'react';
import { AUDIO_SCRIPTS_BY_PARAM_ID, fillAudioScript } from '@/lib/audioScripts';
import { speak, stopSpeech } from '@/lib/speech';
import FigureBatteryIcon from '@/components/icons/FigureBatteryIcon';
import ShieldIcon from '@/components/icons/ShieldIcon';
import BandageIcon from '@/components/icons/BandageIcon';

function parseValueUnit(str) {
  const idx = str.indexOf(' ');
  if (idx === -1) return { value: str, unit: '' };
  return { value: str.slice(0, idx), unit: str.slice(idx + 1) };
}

function parseRange(str) {
  const [lowPart, rest] = str.split('–');
  const { value: high, unit } = parseValueUnit((rest || '').trim());
  return { low: (lowPart || '').trim(), high, unit };
}

function statusFromFlagColor(flagColor, flagBg) {
  if (flagColor === '#E74C3C') return { label: 'LOW', pillBg: flagBg, pillColor: flagColor };
  if (flagColor === '#F39C12') return { label: 'HIGH', pillBg: flagBg, pillColor: flagColor };
  return { label: 'GOOD', pillBg: flagBg, pillColor: flagColor };
}

function estimateDuration(text) {
  const words = text.trim().split(/\s+/).length;
  const totalSeconds = Math.max(10, Math.round((words / 150) * 60));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}s`;
}

const FOODS_BY_CATEGORY = {
  rbc: [
    { emoji: '🥬', name: 'Spinach' },
    { emoji: '🍎', name: 'Fruits' },
    { emoji: '🫘', name: 'Pulses' },
  ],
  wbc: [
    { emoji: '🍊', name: 'Citrus' },
    { emoji: '🧄', name: 'Garlic' },
    { emoji: '🥦', name: 'Broccoli' },
  ],
  plt: [
    { emoji: '🥜', name: 'Nuts' },
    { emoji: '🍇', name: 'Grapes' },
    { emoji: '🥛', name: 'Milk' },
  ],
};

const FOODS_FUNCTION_WORD = {
  rbc: 'energy',
  wbc: 'defense',
  plt: 'clotting',
};

const RESULT_FACTS = {
  rbc: [
    { icon: '⚡', text: 'Low levels can make you feel tired or short of breath.' },
    { icon: '🫁', text: 'Haemoglobin carries oxygen from your lungs to every part of your body.' },
    { icon: '🥗', text: 'Iron-rich foods can help improve your levels over time.' },
  ],
  wbc: [
    { icon: '🦠', text: 'High neutrophils often mean your body is fighting an infection.' },
    { icon: '💊', text: 'Low lymphocytes can affect how well your body responds to viruses.' },
    { icon: '⏳', text: 'These levels often return to normal on their own — ask your doctor.' },
  ],
  plt: [
    { icon: '🩹', text: 'Platelets form a plug to stop bleeding when you get a cut.' },
    { icon: '✅', text: 'Your count is in a healthy range — no action needed.' },
    { icon: '💧', text: 'Staying hydrated helps keep your blood flowing well.' },
  ],
};

function StatusIcon({ category, color }) {
  if (category === 'rbc') return <FigureBatteryIcon color={color} />;
  if (category === 'wbc') return <ShieldIcon color={color} />;
  return <BandageIcon color={color} />;
}

export default function ResultScreen({
  flagColor,
  resultHeading,
  paramDesc,
  t,
  gaugePercent,
  flagBg,
  paramValueLine,
  paramRangeLine,
  goToAsk,
  goToSaved,
  showWbcBreakdown,
  goToWbcBreakdown,
  category,
  paramId,
  paramShortLabel,
  audioMode,
  langCode,
  languageLabel,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const { value: patientValue, unit } = parseValueUnit(paramValueLine);
  const { low, high } = parseRange(paramRangeLine);

  const scriptTemplate = AUDIO_SCRIPTS_BY_PARAM_ID[paramId];
  const narrationText = scriptTemplate ? fillAudioScript(scriptTemplate, patientValue) : '';
  const duration = scriptTemplate ? estimateDuration(scriptTemplate) : '';

  useEffect(() => {
    if (audioMode && scriptTemplate) {
      setIsPlaying(true);
      speak(narrationText, langCode, () => setIsPlaying(false));
    }
    return () => stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTogglePlay() {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speak(narrationText, langCode, () => setIsPlaying(false));
    }
  }

  const status = statusFromFlagColor(flagColor, flagBg);
  const iconIsNormal = flagColor === '#27AE60';
  const iconBg = iconIsNormal ? '#E9F7EF' : '#FDEDEB';
  const iconColor = iconIsNormal ? '#4CAF50' : '#F44336';

  const foods = FOODS_BY_CATEGORY[category] || [];
  const facts = RESULT_FACTS[category] || [];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pt-4 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="text-[19px] font-extrabold" style={{ color: flagColor }}>{resultHeading}</div>
      <div className="text-[14.5px] text-[#6B7280] mt-[6px] leading-[1.55] font-medium">{paramDesc}</div>

      <div className="bg-white rounded-[22px] px-5 py-6 mt-6 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        {scriptTemplate && (
          <>
            <div className="flex items-center gap-3 bg-[#FFF0E8] rounded-xl p-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer text-white"
                style={{ background: '#E8735A' }}
                onClick={handleTogglePlay}
              >
                <span className="text-[15px]">{isPlaying ? '⏸' : '▶'}</span>
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[#1A1A2E]">Listen to {paramShortLabel} Explanation</div>
                <div className="text-[12px] text-[#E8735A] font-medium mt-[1px]">
                  Tap to hear audio in {languageLabel} ({duration})
                </div>
              </div>
            </div>
            <div className="border-t border-[#F3EDE8] my-5" />
          </>
        )}

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
            <StatusIcon category={category} color={iconColor} />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.06em]">Your Level</div>
            <div className="text-[22px] font-extrabold text-[#1A1A2E]">
              {patientValue} <span className="text-[14px] font-semibold text-[#6B7280]">{unit}</span>
            </div>
          </div>
          <div
            className="rounded-full px-3 py-[6px] text-[12px] font-bold flex-shrink-0"
            style={{ background: status.pillBg, color: status.pillColor }}
          >
            {status.label === 'GOOD' ? '✓' : '⚠'} {status.label}
          </div>
        </div>

        <div className="relative mt-[22px]">
          <div
            className="absolute -top-[22px] text-[13px] font-bold whitespace-nowrap"
            style={{ left: `${gaugePercent}%`, transform: 'translateX(-50%)', color: flagColor }}
          >
            {patientValue}
          </div>
          <div className="relative h-[10px] rounded-[6px] bg-[linear-gradient(90deg,#E74C3C_0%,#27AE60_50%,#F39C12_100%)]">
            <div
              className="absolute top-1/2 w-[22px] h-[22px] rounded-full border-4 border-white shadow-[0_3px_10px_rgba(0,0,0,0.25)]"
              style={{ left: `${gaugePercent}%`, transform: 'translate(-50%,-50%)', background: flagColor }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold mt-[8px]">
            <span style={{ color: '#E74C3C' }}>LOW ({low})</span>
            <span style={{ color: '#27AE60' }}>NORMAL (HEALTHY)</span>
            <span style={{ color: '#E74C3C' }}>HIGH ({high})</span>
          </div>
        </div>

        <div className="border-t border-[#F3EDE8] my-5" />

        <div className="text-[14px] font-bold text-[#1A1A2E]">
          Foods to keep your {FOODS_FUNCTION_WORD[category]} up:
        </div>
        <div className="flex gap-2 mt-3">
          {foods.map((food) => (
            <div key={food.name} className="flex-1 flex flex-col items-center gap-[6px]">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[22px]" style={{ background: '#F5EDE3' }}>
                {food.emoji}
              </div>
              <span className="text-[12px] font-semibold text-[#1A1A2E]">{food.name}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#F3EDE8] my-5" />

        <div className="text-[13px] font-bold text-[#9CA3AF] uppercase tracking-[0.06em] mb-3">Good to know</div>
        <div className="flex flex-col gap-3">
          {facts.map((fact, i) => (
            <div key={i} className="flex items-start gap-3 bg-[#FDF6F0] rounded-xl px-4 py-3">
              <span className="text-[18px] flex-shrink-0">{fact.icon}</span>
              <span className="text-[13.5px] text-[#1A1A2E] font-medium leading-[1.5]">{fact.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />
      <div className="flex gap-3 mt-6">
        <button
          className="flex-1 bg-transparent text-[#C0392B] border-[1.5px] border-[#F0DCD3] rounded-[27px] px-[10px] py-[15px] text-[14px] font-bold cursor-pointer min-h-[52px] flex items-center justify-center gap-[6px]"
          onClick={goToAsk}
        >
          💬 More
        </button>
        <button
          className="flex-1 bg-transparent text-[#C0392B] border-[1.5px] border-[#F0DCD3] rounded-[27px] px-[10px] py-[15px] text-[14px] font-bold cursor-pointer min-h-[52px] flex items-center justify-center gap-[6px]"
          onClick={goToSaved}
        >
          🔖 {t.saveForLater}
        </button>
      </div>

      {showWbcBreakdown && (
        <button
          className="w-full mt-3 bg-[#F9F3EF] text-[#9E8A7D] border-[1.5px] border-[#F0DCD3] rounded-[27px] px-[10px] py-[15px] text-[14px] font-bold cursor-pointer min-h-[52px] flex items-center justify-center gap-[6px]"
          onClick={goToWbcBreakdown}
        >
          📊 {t.seeBreakdown}
        </button>
      )}
    </div>
  );
}
