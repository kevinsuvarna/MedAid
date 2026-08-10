import { useEffect, useState } from 'react';
import { voiceCodeFor, SpeakerIcon } from '@/components/screens/WBCConceptScreen';
import { PARAM_LABELS, flagWord, allParamRows } from '@/components/screens/DoctorQuestionsScreen';
import { speak } from '@/lib/speech';
import { callGroq } from '@/lib/groqClient';
import { USE_MOCK, MOCK_ASK_MY_DOC_QUESTIONS } from '@/lib/config';

const ASK_MY_DOC_SYSTEM_PROMPT =
  "You are a helpful medical assistant. Based on a patient's CBC report, suggest 3 short, specific questions they could ask their doctor about the abnormal or borderline results. Keep each question under 10 words. Use plain language, no medical jargon, no intro text. Number each question.";

function parseQuestions(text) {
  const trimmed = text.trim();
  const parts = trimmed
    .split(/(?=\d+[.)]\s)/g)
    .map((s) => s.replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);
  return parts.length ? parts : [trimmed];
}

const INITIAL_SAVED = [
  { id: 1, text: 'Can low haemoglobin cause my tiredness?' },
  { id: 2, text: 'Is this related to my diet or something else?' },
];

const CHIP_LABELS = ['Next tests', 'Medication', 'Haemoglobin', 'Diet & food'];

export default function AskMyDocScreen({ t, langCode, reportData, onBack, onLanguageClick, languageLabel }) {
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const [suggested, setSuggested] = useState([]);
  const [saved, setSaved] = useState(INITIAL_SAVED);
  const [nextId, setNextId] = useState(INITIAL_SAVED.length + 1);
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (USE_MOCK) {
        if (!cancelled) {
          setSuggested(MOCK_ASK_MY_DOC_QUESTIONS);
          setSuggestedLoading(false);
        }
        return;
      }
      const valuesList = allParamRows(reportData)
        .map((row) => `${PARAM_LABELS[row.id] || row.id}: ${row.value} ${row.unit} (${flagWord(row.flag)})`)
        .join('; ');
      const userPrompt = `CBC results: ${valuesList}. Suggest short questions this patient could ask their doctor.`;
      const text = await callGroq(ASK_MY_DOC_SYSTEM_PROMPT, userPrompt);
      if (!cancelled) {
        setSuggested(parseQuestions(text));
        setSuggestedLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addSaved(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaved((prev) => [...prev, { id: nextId, text: trimmed }]);
    setNextId((id) => id + 1);
    setDraft('');
    setShowComposer(false);
  }

  function removeSaved(id) {
    setSaved((prev) => prev.filter((q) => q.id !== id));
  }

  function pickChip(label) {
    setDraft((prev) => (prev ? `${prev} ${label}` : label));
  }

  function speakAll() {
    const text = [t.askMyDocTitle, ...suggested, ...saved.map((q) => q.text)].join('. ');
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
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 8px 30px rgba(30,40,90,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[16px] text-white flex-shrink-0"
            style={{ background: 'linear-gradient(150deg, #7B85D9 0%, #5A62C6 100%)' }}
          >
            💬
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-[#1A237E]">{t.askMyDocTitle}</div>
            <div className="text-[11.5px] text-[#7A7F94] mt-[2px]">{t.askMyDocSubtitle}</div>
          </div>
          <button
            className="bg-transparent border-none cursor-pointer flex-shrink-0"
            onClick={speakAll}
            aria-label={t.listen}
          >
            <SpeakerIcon />
          </button>
        </div>

        <div className="text-[10.5px] font-bold tracking-[0.06em] text-[#8A8FA8] mt-[18px] mb-[10px]">
          SUGGESTED, BASED ON YOUR REPORT
        </div>
        {suggestedLoading ? (
          <div className="flex items-center gap-[10px] px-[2px] py-[6px]">
            <div className="w-[16px] h-[16px] border-[2.5px] border-[#D9DCF0] border-t-[#5A62C6] rounded-full animate-spin" />
            <span className="text-[12.5px] text-[#7A7F94] font-medium">Thinking about your report…</span>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {suggested.map((qText, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-[10px] bg-[#EAECF9] rounded-[16px] px-[14px] py-[13px]"
              >
                <span className="text-[13.5px] font-semibold text-[#25283F] leading-[1.35]">{qText}</span>
                <button
                  className="w-[26px] h-[26px] rounded-full bg-[#C2C6E4] flex items-center justify-center flex-shrink-0 text-[15px] font-bold text-[#25283F] border-none cursor-pointer"
                  onClick={() => addSaved(qText)}
                  aria-label="Add question"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-[10.5px] font-bold tracking-[0.06em] text-[#8A8FA8] mt-4 mb-[10px]">
          YOUR SAVED QUESTIONS ({saved.length})
        </div>
        <div className="flex flex-col gap-[10px]">
          {saved.map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between gap-[10px] bg-white rounded-[16px] px-[14px] py-[13px] shadow-[0_3px_10px_rgba(30,40,90,0.08)]"
            >
              <span className="text-[13.5px] font-semibold text-[#25283F] leading-[1.35]">{q.text}</span>
              <button
                className="text-[16px] flex-shrink-0 bg-transparent border-none cursor-pointer"
                onClick={() => removeSaved(q.id)}
                aria-label="Delete question"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {showComposer ? (
          <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
            <div className="text-[10.5px] font-bold tracking-[0.06em] text-[#8A8FA8] mt-4 mb-[10px]">
              SUGGESTED QUESTIONS
            </div>
            <div className="flex gap-[6px] mb-3">
              {CHIP_LABELS.map((label) => (
                <button
                  key={label}
                  className="flex-1 min-w-0 text-[9px] font-semibold text-[#333952] bg-[#EAECF9] rounded-[10px] px-1 py-[4px] whitespace-nowrap overflow-hidden text-ellipsis border-none cursor-pointer"
                  onClick={() => pickChip(label)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="bg-white border border-[#E2E4F0] rounded-[16px] p-[14px] shadow-[0_4px_16px_rgba(30,40,90,0.08)]">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your question..."
                className="w-full min-h-[52px] border-none outline-none resize-none text-[13.5px] text-[#25283F] bg-transparent"
              />
              <div className="flex justify-end mt-[6px]">
                <button
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[15px] border-none cursor-pointer flex-shrink-0"
                  style={{ background: 'linear-gradient(150deg, #7B85D9 0%, #5A62C6 100%)' }}
                  onClick={() => addSaved(draft)}
                  aria-label="Send"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            className="w-full mt-[22px] rounded-[18px] p-[15px] text-[14.5px] font-bold text-white border-none cursor-pointer"
            style={{
              background: 'linear-gradient(150deg, #7B85D9 0%, #5A62C6 100%)',
              boxShadow: '0 8px 20px rgba(90,80,220,0.35)',
            }}
            onClick={() => setShowComposer(true)}
          >
            + Add a Question
          </button>
        )}
      </div>
    </div>
  );
}
