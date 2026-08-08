import { useEffect } from 'react';
import { speak, stopSpeech } from '@/lib/speech';

const WHY_MEASURED_CONTENT = {
  rbc: {
    title: 'Why Are Red Blood Cells Measured?',
    rows: [
      {
        name: 'Total RBC Count',
        reason:
          'Counts how many red cells are present; used alongside haemoglobin since the count alone does not measure oxygen-carrying capacity.',
      },
      {
        name: 'Haemoglobin',
        reason:
          'The most important indicator of how well your blood carries oxygen and the primary way doctors diagnose anaemia.',
      },
      {
        name: 'PCV / HCT',
        reason:
          'Confirms anaemia by showing what percentage of your blood is red cells; a high value can also signal dehydration.',
      },
      {
        name: 'MCV',
        reason:
          'Reveals the type of anaemia by measuring red cell size — small cells usually mean low iron; large cells usually mean low Vitamin B12 or folate.',
      },
      {
        name: 'MCH',
        reason: 'Shows how much haemoglobin each red cell contains; low values point to iron deficiency or thalassemia.',
      },
      {
        name: 'MCHC',
        reason:
          'Measures how densely haemoglobin is packed inside each cell; helps distinguish between specific types of anaemia.',
      },
      {
        name: 'RDW-CV',
        reason:
          'Detects variation in red cell sizes; often the earliest sign of a nutritional deficiency before haemoglobin itself drops.',
      },
    ],
  },
  wbc: {
    title: 'Why Are White Blood Cells Measured?',
    rows: [
      {
        name: 'Total WBC Count',
        reason:
          'The first signal of immune system activity — high counts suggest infection or inflammation; low counts suggest the immune system may need support.',
      },
      {
        name: 'Neutrophils',
        reason:
          "The body's first responders to bacterial infection; the most diagnostically significant white cell type in routine testing.",
      },
      {
        name: 'Lymphocytes',
        reason:
          'Virus fighters and immune memory cells; raised in viral infections, lower than normal when the immune system is under stress.',
      },
      {
        name: 'Monocytes',
        reason: 'Markers of chronic infection and inflammation; elevated levels are associated with TB and prolonged illness.',
      },
      {
        name: 'Eosinophils',
        reason:
          'Detectors of allergies and parasitic infections; particularly relevant in India where parasitic exposure is common.',
      },
      {
        name: 'Basophils',
        reason:
          'Rare cells involved in allergic responses; included to complete the full immune picture even though abnormal values are uncommon.',
      },
    ],
  },
  plt: {
    title: 'Why Are Platelets Measured?',
    rows: [
      {
        name: 'Platelet Count',
        reason:
          "Measures your blood's ability to clot; a falling count is a critical early warning sign of dengue fever, which is common in India.",
      },
      {
        name: 'MPV',
        reason:
          'Measures average platelet size; a high MPV alongside a low count means the body is producing larger platelets urgently to compensate for the shortage.',
      },
    ],
  },
};

export default function WhyMeasuredScreen({ category, langCode, t }) {
  const content = WHY_MEASURED_CONTENT[category] || WHY_MEASURED_CONTENT.rbc;

  useEffect(() => () => stopSpeech(), []);

  function handleListen() {
    const text = content.rows.map((row) => `${row.name}. ${row.reason}`).join(' ');
    speak(text, langCode);
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-y-auto pt-4 px-[22px] pb-[22px]"
      style={{ animation: 'fadeIn 0.3s ease' }}
    >
      <div className="flex items-center justify-between gap-[10px]">
        <div className="text-[19px] font-extrabold text-[#1A1A2E]">{content.title}</div>
        <button
          className="bg-white border-[1.5px] border-[#F0DCD3] rounded-full w-[40px] h-[40px] flex items-center justify-center text-[16px] cursor-pointer flex-shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          onClick={handleListen}
          aria-label={t.listen}
        >
          🔊
        </button>
      </div>

      <div className="bg-white rounded-2xl divide-y divide-[#F3EDE8] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden mt-5">
        {content.rows.map((row) => (
          <div key={row.name} className="px-[18px] py-4">
            <div className="text-[15px] font-bold text-[#1A1A2E]">{row.name}</div>
            <div className="text-[13.5px] text-[#6B7280] font-medium leading-[1.5] mt-1">{row.reason}</div>
          </div>
        ))}
      </div>

      <div className="flex-1" />
    </div>
  );
}
