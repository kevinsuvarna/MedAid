import { useEffect, useState } from 'react';
import { getParam, CATEGORY_PARAM_IDS } from '@/lib/reportAdapter';
import { speak, stopSpeech } from '@/lib/speech';
import { callGroq } from '@/lib/groqClient';
import { USE_MOCK, MOCK_DOCTOR_QUESTIONS } from '@/lib/config';

export const PARAM_LABELS = {
  rbcCount: 'Total RBC Count',
  hb: 'Haemoglobin',
  pcv: 'PCV/HCT',
  mcv: 'MCV',
  mch: 'MCH',
  mchc: 'MCHC',
  rdwCv: 'RDW-CV',
  totalWbc: 'Total WBC',
  neutrophils: 'Neutrophils',
  lymphocytes: 'Lymphocytes',
  monocytes: 'Monocytes',
  eosinophils: 'Eosinophils',
  basophils: 'Basophils',
  platelets: 'Platelet Count',
  mpv: 'MPV',
};

const DOCTOR_QUESTIONS_SYSTEM_PROMPT =
  "You are a helpful medical assistant. Based on a patient's CBC report, suggest 3 to 5 simple questions they should ask their doctor. Use plain language. Number each question. No medical jargon.";

export function flagWord(flag) {
  if (flag === 'below') return 'low';
  if (flag === 'above') return 'high';
  return 'normal';
}

export function allParamRows(reportData) {
  const rows = [];
  ['rbc', 'wbc', 'plt'].forEach((cat) => {
    (CATEGORY_PARAM_IDS[cat] || []).forEach((id) => {
      const row = getParam(reportData, cat, id);
      if (row) rows.push(row);
    });
  });
  return rows;
}

function parseResponse(text) {
  const trimmed = text.trim();
  const firstNumberMatch = trimmed.match(/\d+[.)]\s/);
  const introEnd = firstNumberMatch ? firstNumberMatch.index : 0;
  const intro = trimmed.slice(0, introEnd).trim();
  const rest = trimmed.slice(introEnd);

  const questions = rest
    .split(/(?=\d+[.)]\s)/g)
    .map((s) => s.replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);

  return questions.length ? { intro, questions } : { intro: '', questions: [trimmed] };
}

export default function DoctorQuestionsScreen({ t, langCode, reportData }) {
  const [loading, setLoading] = useState(true);
  const [intro, setIntro] = useState('');
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (USE_MOCK) {
        if (!cancelled) {
          setIntro(MOCK_DOCTOR_QUESTIONS.intro);
          setQuestions(MOCK_DOCTOR_QUESTIONS.questions);
          setLoading(false);
        }
        return;
      }
      const valuesList = allParamRows(reportData)
        .map((row) => `${PARAM_LABELS[row.id] || row.id}: ${row.value} ${row.unit} (${flagWord(row.flag)})`)
        .join('; ');
      const userPrompt = `CBC results: ${valuesList}. What should this patient ask their doctor?`;
      const text = await callGroq(DOCTOR_QUESTIONS_SYSTEM_PROMPT, userPrompt);
      if (!cancelled) {
        const parsed = parseResponse(text);
        setIntro(parsed.intro);
        setQuestions(parsed.questions);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleReadAll() {
    if (questions.length === 0) return;
    speak([intro, ...questions].filter(Boolean).join('. '), langCode);
  }

  return (
    <div className="flex flex-col flex-1 pt-4 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex items-center justify-between gap-[10px]">
        <div className="text-[19px] font-extrabold text-[#1A1A2E]">Questions for Your Doctor</div>
        <button
          className="bg-white border-[1.5px] border-[#F0DCD3] rounded-full w-[40px] h-[40px] flex items-center justify-center text-[16px] cursor-pointer flex-shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.06)] disabled:opacity-60 disabled:cursor-default"
          onClick={handleReadAll}
          disabled={loading || questions.length === 0}
          aria-label={t.listen}
        >
          🔊
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-[3px] border-[#F0DCD3] border-t-[#C0392B] rounded-full animate-spin" />
          <div className="text-[14px] text-[#6B7280] font-semibold">Thinking about your report…</div>
        </div>
      ) : (
        <>
          {intro && (
            <div className="bg-[#FDF6F0] rounded-[18px] px-[18px] py-4 mt-5">
              <span className="text-[14px] text-[#6B7280] font-medium leading-[1.5]">{intro}</span>
            </div>
          )}

          <div className={`flex flex-col gap-3 ${intro ? 'mt-3' : 'mt-5'}`}>
            {questions.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-[14px] bg-white rounded-[18px] px-[18px] py-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              >
                <span className="text-[14px] font-extrabold text-[#C0392B] flex-shrink-0">{i + 1}.</span>
                <span className="text-[14.5px] text-[#1A1A2E] font-semibold leading-[1.5]">{q}</span>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <button className="w-full bg-[#F9F3EF] text-[#9E8A7D] border-[1.5px] border-[#F0DCD3] rounded-2xl p-[15px] text-[13.5px] font-bold cursor-default">
              {t.explanationDoctorCta}
            </button>
          </div>
        </>
      )}

      <div className="flex-1" />
    </div>
  );
}
