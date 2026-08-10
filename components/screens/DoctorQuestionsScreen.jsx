import { useEffect, useState } from 'react';
import { getParam, CATEGORY_PARAM_IDS } from '@/lib/reportAdapter';
import { speak, stopSpeech } from '@/lib/speech';
import { callGroq } from '@/lib/groqClient';

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
  'You are a medical assistant helping a patient with low health literacy in India prepare questions for their doctor after a CBC test. Generate 4-5 short, simple questions in plain language based only on parameters that are outside the normal range. Number each question. Return only the questions, no preamble.';

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

// Human-readable labels for reportData's own leaf keys (haemoglobin,
// rbc_count, total_wbc, ...) — a different naming scheme from PARAM_LABELS
// above, which is keyed by reportAdapter's internal ids (hb, rbcCount,
// totalWbc, ...). Used to build the Groq prompt straight from reportData's
// raw value/unit/ref_low/ref_high/flag, since that's what MOCK_DATA (the
// reportData this screen gets in dev) actually contains — getParam()
// re-derives low/high from canonical ranges and drops the report's own
// ref_low/ref_high and 'borderline' flag, which the prompt needs.
const RAW_PARAM_LABELS = {
  haemoglobin: 'Haemoglobin (Hb)',
  rbc_count: 'Total RBC Count',
  pcv: 'PCV/HCT',
  mcv: 'MCV',
  mch: 'MCH',
  mchc: 'MCHC',
  rdw_cv: 'RDW-CV',
  total_wbc: 'Total WBC Count',
  neutrophils: 'Neutrophils',
  lymphocytes: 'Lymphocytes',
  eosinophils: 'Eosinophils',
  monocytes: 'Monocytes',
  basophils: 'Basophils',
  platelet_count: 'Platelet Count',
  mpv: 'MPV',
};

function buildReportValuesList(reportData) {
  const lines = [];
  ['rbc', 'wbc', 'platelets'].forEach((group) => {
    const params = reportData && reportData[group];
    if (!params) return;
    Object.entries(params).forEach(([key, leaf]) => {
      if (!leaf || leaf.value == null) return;
      const label = RAW_PARAM_LABELS[key] || key;
      const unit = leaf.unit ? ` ${leaf.unit}` : '';
      const ref = leaf.ref_low != null && leaf.ref_high != null ? `, reference range ${leaf.ref_low}-${leaf.ref_high}` : '';
      const flag = leaf.flag ? `, flag: ${leaf.flag}` : '';
      lines.push(`${label}: ${leaf.value}${unit}${ref}${flag}`);
    });
  });
  return lines.join('\n');
}

// Groq is asked to return only numbered questions with no preamble, but the
// split still tolerates a stray intro line or a response with no numbering
// at all (e.g. the "Could not load response" fallback) by falling back to
// treating the whole reply as a single question.
function parseQuestions(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const firstNumberMatch = trimmed.match(/\d+[.)]\s/);
  if (!firstNumberMatch) return [trimmed];

  const rest = trimmed.slice(firstNumberMatch.index);
  const questions = rest
    .split(/(?=\d+[.)]\s)/g)
    .map((s) => s.replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);

  return questions.length ? questions : [trimmed];
}

const PLACEHOLDER_ANSWER = 'Your doctor will be able to explain this based on your full medical history.';

export default function DoctorQuestionsScreen({ t, langCode, reportData }) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const valuesList = buildReportValuesList(reportData);
      const userPrompt = `CBC report values and flags:\n${valuesList}\nGenerate questions the patient should ask their doctor about abnormal values only.`;
      const text = await callGroq(DOCTOR_QUESTIONS_SYSTEM_PROMPT, userPrompt);
      if (!cancelled) {
        setQuestions(parseQuestions(text));
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
    speak(questions.join('. '), langCode);
  }

  return (
    <div className="flex flex-col flex-1 pt-4 px-[22px] pb-[22px]">
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
          <div className="flex flex-col gap-3 mt-5">
            {questions.map((q, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-4 cursor-pointer"
                  style={isOpen ? { borderLeft: '4px solid #C0392B' } : undefined}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-[10px]">
                      <span className="text-[14px] font-extrabold text-[#C0392B] flex-shrink-0">{i + 1}.</span>
                      <span className="text-[14.5px] font-semibold text-[#1A1A2E] leading-[1.5]">{q}</span>
                    </div>
                    <span
                      className="text-[14px] text-[#9CA3AF] flex-shrink-0 transition-transform"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      ▾
                    </span>
                  </div>
                  {isOpen && (
                    <div className="text-[13.5px] text-[#6B7280] font-medium leading-[1.5] mt-3">
                      {PLACEHOLDER_ANSWER}
                    </div>
                  )}
                </div>
              );
            })}
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
