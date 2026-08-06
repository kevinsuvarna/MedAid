'use client';

import { useEffect, useState } from 'react';
import { LANG_META, T } from '@/lib/translations';
import { CAT_DEFS, PARAMS, SCREEN_STEP, FACTS } from '@/lib/data';
import { speak, stopSpeech, startVoiceInput as startVoiceInputHelper } from '@/lib/speech';
import PhoneFrame from '@/components/PhoneFrame';
import LangScreen from '@/components/screens/LangScreen';
import OpeningScreen from '@/components/screens/OpeningScreen';
import OverviewScreen from '@/components/screens/OverviewScreen';
import ConceptScreen from '@/components/screens/ConceptScreen';
import ResultScreen from '@/components/screens/ResultScreen';
import AskScreen from '@/components/screens/AskScreen';
import ExplanationScreen from '@/components/screens/ExplanationScreen';
import SavedScreen from '@/components/screens/SavedScreen';

function gaugePercentFor(param) {
  const { value, low, high, flag } = param;
  if (flag === 'below') {
    const pct = Math.max(0, Math.min(1, value / low)) * 25;
    return Math.min(23, Math.max(2, pct));
  }
  if (flag === 'above') {
    const span = high * 0.5 || 1;
    const pct = 75 + Math.max(0, Math.min(1, (value - high) / span)) * 25;
    return Math.min(98, Math.max(77, pct));
  }
  const pct = 25 + Math.max(0, Math.min(1, (value - low) / (high - low))) * 50;
  return Math.min(73, Math.max(27, pct));
}

function flagColorFor(flag) {
  if (flag === 'below') return '#E74C3C';
  if (flag === 'above') return '#F39C12';
  return '#27AE60';
}

function flagBgFor(flag) {
  if (flag === 'below') return '#FDEDEB';
  if (flag === 'above') return '#FEF3E2';
  return '#E9F7EF';
}

export default function CbcApp() {
  const [screen, setScreen] = useState('lang');
  const [langId, setLangId] = useState('en');
  const [audioMode, setAudioMode] = useState(false);
  const [category, setCategory] = useState(null);
  const [showNumbers, setShowNumbers] = useState(false);
  const [narrateIndex, setNarrateIndex] = useState(-1);
  const [narrateAskIndex, setNarrateAskIndex] = useState(-1);
  const [askTranscript, setAskTranscript] = useState('');
  const [askListening, setAskListening] = useState(false);
  const [askVoiceUnavailable, setAskVoiceUnavailable] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const lang = LANG_META.find((l) => l.id === langId) || LANG_META[0];
  const t = T[langId] || T.en;

  function categoryName(id) {
    if (id === 'rbc') return t.rbcName;
    if (id === 'wbc') return t.wbcName;
    return t.pltName;
  }
  function categoryDesc(id) {
    if (id === 'rbc') return t.rbcDesc;
    if (id === 'wbc') return t.wbcDesc;
    return t.pltDesc;
  }
  function resultHeadingText() {
    if (category === 'rbc') return t.hbHeading;
    if (category === 'wbc') return t.wbcHeading;
    if (category === 'plt') return t.pltHeading;
    return '';
  }
  function resultDescText() {
    if (category === 'rbc') return t.hbDesc;
    if (category === 'wbc') return t.wbcResultDesc;
    if (category === 'plt') return t.pltResultDesc;
    return '';
  }
  function resultStatusText() {
    const param = PARAMS[category];
    if (!param) return '';
    const statusWord = t[param.flag];
    return `${resultHeadingText()}. ${resultDescText()} Your result is ${statusWord} the reference range.`;
  }
  function paramLabelText(cat) {
    if (cat === 'rbc') return t.hbLabel;
    if (cat === 'wbc') return t.wbcLabel;
    if (cat === 'plt') return t.pltLabel;
    return '';
  }
  function factsFor(cat) {
    const byLang = FACTS[langId] || FACTS.en;
    return byLang[cat] || [];
  }
  function askOptionTexts() {
    return [t.askWhatMeans, t.askWhyMeasured, t.askAskDoctor, t.askOwnWords];
  }

  function narrateOverviewSequence(i) {
    if (i >= CAT_DEFS.length) {
      setNarrateIndex(-1);
      return;
    }
    setNarrateIndex(i);
    const cat = CAT_DEFS[i].id;
    speak(categoryName(cat) + '. ' + categoryDesc(cat), lang.code, () => narrateOverviewSequence(i + 1));
  }

  function narrateAskSequence(i) {
    const opts = askOptionTexts();
    if (i >= opts.length) {
      setNarrateAskIndex(-1);
      return;
    }
    setNarrateAskIndex(i);
    speak(opts[i], lang.code, () => narrateAskSequence(i + 1));
  }

  function maybeNarrateScreen() {
    if (!audioMode) return;
    if (screen === 'opening') {
      speak(t.greeting + '. ' + t.openingLine, lang.code);
    } else if (screen === 'overview') {
      narrateOverviewSequence(0);
    } else if (screen === 'concept') {
      speak(categoryName(category) + '. ' + categoryDesc(category), lang.code);
    } else if (screen === 'result') {
      speak(resultStatusText(), lang.code);
    } else if (screen === 'ask') {
      narrateAskSequence(0);
    } else if (screen === 'explanation') {
      const facts = factsFor(category);
      speak([t.explanationTitle, paramLabelText(category), ...facts.map((f) => f.text)].join('. '), lang.code);
    } else if (screen === 'saved') {
      speak(t.savedHeading + '. ' + t.savedBody, lang.code);
    }
  }

  useEffect(() => {
    stopSpeech();
    setShowNumbers(false);
    setNarrateIndex(-1);
    setNarrateAskIndex(-1);
    setAskTranscript('');
    setAskListening(false);
    setAskVoiceUnavailable(false);
    setFeedbackGiven(false);
    maybeNarrateScreen();
    return () => stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  function selectLanguage(id) {
    setLangId(id);
    setScreen('opening');
  }
  function exploreReport() {
    setScreen('overview');
  }
  function listenToReport() {
    setAudioMode(true);
    setScreen('overview');
  }
  function selectCategory(id) {
    setScreen('concept');
    setCategory(id);
  }
  function backToOverview() {
    setScreen('overview');
    setCategory(null);
  }
  function backToConcept() {
    setScreen('concept');
  }
  function goToResult() {
    setScreen('result');
  }
  function toggleNumbers() {
    setShowNumbers((v) => !v);
  }
  function goToAsk() {
    setScreen('ask');
  }
  function goToSaved() {
    setScreen('saved');
  }
  function backToResult() {
    setScreen('result');
  }
  function backToAsk() {
    setScreen('ask');
  }
  function goToExplanation() {
    setScreen('explanation');
  }
  function exploreAnotherPart() {
    setScreen('overview');
    setCategory(null);
  }
  function giveFeedback() {
    setFeedbackGiven(true);
  }
  function updateAskTranscript(e) {
    setAskTranscript(e.target.value);
  }

  function handleStartVoiceInput() {
    startVoiceInputHelper(lang.code, {
      onStart: () => {
        setAskListening(true);
        setAskVoiceUnavailable(false);
        setAskTranscript('');
      },
      onResult: (transcript) => {
        setAskTranscript(transcript);
        setAskListening(false);
      },
      onError: (unavailable) => {
        setAskListening(false);
        setAskVoiceUnavailable(true);
        if (unavailable) setAskTranscript('');
      },
      onEnd: () => {
        setAskListening(false);
      },
    });
  }

  const param = category ? PARAMS[category] : null;
  const stepIdx = SCREEN_STEP[screen];
  const progressSteps = [0, 1, 2, 3].map((i) => ({
    color: stepIdx !== undefined && i <= stepIdx ? '#C0392B' : '#F0DCD3',
  }));

  const languages = LANG_META.map((l) => ({
    label: l.label,
    hint: l.hint,
    select: () => selectLanguage(l.id),
    speak: (e) => {
      e.stopPropagation();
      speak(l.label, lang.code);
    },
  }));

  const categories = CAT_DEFS.map((c) => ({
    id: c.id,
    bg: c.bg,
    accent: c.accent,
    name: categoryName(c.id),
    desc: categoryDesc(c.id),
    select: () => selectCategory(c.id),
  }));

  let gaugePercent = 0;
  let flagColor = '#27AE60';
  let flagBg = '#E9F7EF';
  let resultStatusLine = '';
  let paramValueLine = '';
  let paramRangeLine = '';
  let resultHeading = '';
  let paramDesc = '';
  if (param) {
    gaugePercent = gaugePercentFor(param);
    flagColor = flagColorFor(param.flag);
    flagBg = flagBgFor(param.flag);
    resultHeading = resultHeadingText();
    paramDesc = resultDescText();
    resultStatusLine = `Your result is ${t[param.flag]} the reference range.`;
    paramValueLine = `${param.value} ${param.unit}`;
    paramRangeLine = `${param.low}–${param.high} ${param.unit}`;
  }

  const askOptionDefs = [
    { icon: '💬', label: t.askWhatMeans, onClick: () => goToExplanation(), showSpeaker: true, speakText: t.askWhatMeans },
    { icon: '💬', label: t.askWhyMeasured, onClick: () => speak(t.askWhyMeasured, lang.code), showSpeaker: true, speakText: t.askWhyMeasured },
    { icon: '💬', label: t.askAskDoctor, onClick: () => speak(t.askAskDoctor, lang.code), showSpeaker: true, speakText: t.askAskDoctor },
    { icon: '🎙️', label: t.askOwnWords, onClick: () => handleStartVoiceInput(), showSpeaker: false, speakText: t.askOwnWords },
  ];
  const askOptions = askOptionDefs.map((o, i) => ({
    icon: o.icon,
    label: o.label,
    onClick: o.onClick,
    showSpeaker: o.showSpeaker,
    speak: (e) => {
      e.stopPropagation();
      speak(o.speakText, lang.code);
    },
    border: narrateAskIndex === i ? '2px solid #C0392B' : '1.5px solid transparent',
    shadow: narrateAskIndex === i ? '0 4px 20px rgba(192,57,43,0.22)' : '0 4px 16px rgba(0,0,0,0.08)',
  }));

  const savedCategoryCards = CAT_DEFS.map((c) => ({
    bg: c.bg,
    accent: c.accent,
    icon: c.id === 'rbc' ? '🩸' : c.id === 'wbc' ? '🛡️' : '🩹',
    label: c.id === 'rbc' ? t.labelRed : c.id === 'wbc' ? t.labelBlue : t.labelPurple,
    select: () => selectCategory(c.id),
  }));

  const numbersToggleLabel = showNumbers ? t.hideNumbers : t.seeNumbers;
  const showAskTranscript = askListening || !!askTranscript;

  return (
    <PhoneFrame showProgress={screen !== 'lang'} progressSteps={progressSteps}>
      {screen === 'lang' && <LangScreen languages={languages} />}

      {screen === 'opening' && (
        <OpeningScreen
          languageLabel={lang.label}
          t={t}
          patientReportLabel={t.patientReportLabel}
          exploreReport={exploreReport}
          listenToReport={listenToReport}
        />
      )}

      {screen === 'overview' && <OverviewScreen t={t} categories={categories} />}

      {screen === 'concept' && (
        <ConceptScreen
          backToOverview={backToOverview}
          currentCategoryName={category ? categoryName(category) : ''}
          currentCategoryBg={category ? (CAT_DEFS.find((c) => c.id === category) || {}).bg : '#FBE4DA'}
          category={category}
          currentCategoryDesc={category ? categoryDesc(category) : ''}
          speakConceptDesc={() => speak(categoryName(category) + '. ' + categoryDesc(category), lang.code)}
          t={t}
          goToResult={goToResult}
        />
      )}

      {screen === 'result' && (
        <ResultScreen
          backToConcept={backToConcept}
          flagColor={flagColor}
          resultHeading={resultHeading}
          paramDesc={paramDesc}
          t={t}
          gaugePercent={gaugePercent}
          flagBg={flagBg}
          resultStatusLine={resultStatusLine}
          speakResultLine={() => speak(resultStatusLine, lang.code)}
          toggleNumbers={toggleNumbers}
          numbersToggleLabel={numbersToggleLabel}
          showNumbers={showNumbers}
          paramValueLine={paramValueLine}
          paramRangeLine={paramRangeLine}
          goToAsk={goToAsk}
          goToSaved={goToSaved}
        />
      )}

      {screen === 'ask' && (
        <AskScreen
          backToResult={backToResult}
          t={t}
          askOptions={askOptions}
          showAskTranscript={showAskTranscript}
          askTranscript={askTranscript}
          onAskTranscriptChange={updateAskTranscript}
          askVoiceUnavailable={askVoiceUnavailable}
        />
      )}

      {screen === 'explanation' && (
        <ExplanationScreen
          backToAsk={backToAsk}
          t={t}
          explanationParamLabel={category ? paramLabelText(category) : ''}
          explanationFacts={category ? factsFor(category) : []}
          category={category}
          langId={langId}
          feedbackGiven={feedbackGiven}
          giveFeedback={giveFeedback}
        />
      )}

      {screen === 'saved' && (
        <SavedScreen t={t} exploreAnotherPart={exploreAnotherPart} savedCategoryCards={savedCategoryCards} />
      )}
    </PhoneFrame>
  );
}
