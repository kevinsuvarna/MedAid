'use client';

import { useEffect, useState } from 'react';
import { LANG_META, T } from '@/lib/translations';
import { CAT_DEFS, PARAMS, SCREEN_STEP, FACTS, WBC_DIFFERENTIAL, CATEGORY_TAGLINES } from '@/lib/data';
import { speak, stopSpeech, startVoiceInput as startVoiceInputHelper } from '@/lib/speech';
import PhoneFrame from '@/components/PhoneFrame';
import TopNavBar from '@/components/TopNavBar';
import LangScreen from '@/components/screens/LangScreen';
import OpeningScreen from '@/components/screens/OpeningScreen';
import OverviewScreen from '@/components/screens/OverviewScreen';
import ConceptScreen from '@/components/screens/ConceptScreen';
import ResultScreen from '@/components/screens/ResultScreen';
import WBCDifferentialScreen from '@/components/screens/WBCDifferentialScreen';
import AskScreen from '@/components/screens/AskScreen';
import ExplanationScreen from '@/components/screens/ExplanationScreen';
import FollowUpsScreen from '@/components/screens/FollowUpsScreen';
import FAQScreen from '@/components/screens/FAQScreen';
import DoctorQuestionsScreen from '@/components/screens/DoctorQuestionsScreen';
import WhyMeasuredScreen from '@/components/screens/WhyMeasuredScreen';
import SavedScreen from '@/components/screens/SavedScreen';

const WBC_NORMAL_GREENS = ['#2ECC71', '#27AE60', '#1E8449'];
const WBC_HIGH_COLOR = '#E74C3C';
const WBC_LOW_COLOR = '#E67E22';
const WBC_LOW_BG = '#FFF8E1';
const WBC_HIGH_BG = '#FDEDEB';
const CATEGORY_PRIMARY_PARAM_ID = { rbc: 'hb', wbc: 'totalWbc', plt: 'platelets' };
const CATEGORY_SHORT_LABEL = { rbc: 'RBC', wbc: 'WBC', plt: 'Platelets' };
const CATEGORY_TITLE = { rbc: 'Red Blood Cells (RBC)', wbc: 'White Blood Cells (WBC)', plt: 'Platelets' };

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
  const [narrateIndex, setNarrateIndex] = useState(-1);
  const [narrateAskIndex, setNarrateAskIndex] = useState(-1);
  const [askTranscript, setAskTranscript] = useState('');
  const [askListening, setAskListening] = useState(false);
  const [askVoiceUnavailable, setAskVoiceUnavailable] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedParam, setSelectedParam] = useState(null);

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
    return [t.askWhatMeans, t.askWhyMeasured, t.askAskDoctor, t.askOwnWords, t.askFollowUps];
  }

  function subParamLabel(id) {
    const map = {
      hb: t.hbLabel,
      rbcCount: t.labelRbcCount,
      mcv: t.labelMcv,
      totalWbc: t.labelTotalWbc,
      neutrophils: t.labelNeutrophils,
      lymphocytes: t.labelLymphocytes,
      platelets: t.pltLabel,
      mpv: t.labelMpv,
      monocytes: t.labelMonocytes,
      eosinophils: t.labelEosinophils,
      basophils: t.labelBasophils,
    };
    return map[id] || id;
  }

  function wbcDifferentialNarrationText() {
    const lines = WBC_DIFFERENTIAL.map((seg) => {
      const name = subParamLabel(seg.id);
      if (seg.flag === 'within') return `${name} ${seg.value}%`;
      const word = seg.flag === 'above' ? t.wbcDiffHighWord : t.wbcDiffLowWord;
      return `${name} ${seg.value}% ${word}`;
    });
    return [t.wbcDiffTitle, t.wbcDiffSubtitle, ...lines].join('. ');
  }

  function followUpsSectionsData() {
    return [
      {
        id: 'tests',
        icon: '🧪',
        heading: t.followUpsTestsHeading,
        items: [t.followUpsTest1, t.followUpsTest2],
        disclaimer: t.followUpsDisclaimer,
      },
      { id: 'newTests', icon: '🔬', heading: t.followUpsNewTestsHeading, items: [t.followUpsNewTest1, t.followUpsNewTest2] },
      { id: 'who', icon: '👨‍⚕️', heading: t.followUpsWhoHeading, items: [t.followUpsWho1, t.followUpsWho2] },
    ];
  }

  function followUpsNarrationText() {
    const sections = followUpsSectionsData();
    return [t.followUpsTitle, ...sections.flatMap((s) => [s.heading, ...s.items])].join('. ');
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
    } else if (screen === 'wbcDifferential') {
      speak(wbcDifferentialNarrationText(), lang.code);
    } else if (screen === 'followUps') {
      speak(followUpsNarrationText(), lang.code);
    } else if (screen === 'saved') {
      speak(t.savedHeading + '. ' + t.savedBody, lang.code);
    }
  }

  useEffect(() => {
    stopSpeech();
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

  function pushHistory() {
    setHistory((h) => [...h, { screen, category, selectedParam }]);
  }
  function popHistory() {
    setHistory((h) => h.slice(0, -1));
  }
  function goBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setScreen(prev.screen);
    setCategory(prev.category);
    setSelectedParam(prev.selectedParam);
  }
  function goToLangScreen() {
    pushHistory();
    setScreen('lang');
  }

  function selectLanguage(id) {
    pushHistory();
    setLangId(id);
    setScreen('opening');
  }
  function exploreReport() {
    pushHistory();
    setScreen('overview');
  }
  function listenToReport() {
    pushHistory();
    setAudioMode(true);
    setScreen('overview');
  }
  function enableAudioMode() {
    setAudioMode(true);
  }
  function selectCategory(id) {
    pushHistory();
    setScreen('concept');
    setCategory(id);
  }
  function backToOverview() {
    popHistory();
    setScreen('overview');
    setCategory(null);
  }
  function goToResult() {
    pushHistory();
    setSelectedParam(null);
    setScreen('result');
  }
  function goToParamResult(paramData) {
    pushHistory();
    setSelectedParam(paramData);
    setScreen('result');
  }
  function goToFaq() {
    pushHistory();
    setScreen('faq');
  }
  function goToDoctorQuestions() {
    pushHistory();
    setScreen('doctorQuestions');
  }
  function goToWhyMeasured() {
    pushHistory();
    setScreen('whyMeasured');
  }
  function goToAsk() {
    pushHistory();
    setScreen('ask');
  }
  function goToSaved() {
    pushHistory();
    setScreen('saved');
  }
  function backToResult() {
    popHistory();
    setScreen('result');
  }
  function backToConcept() {
    popHistory();
    setScreen('concept');
  }
  function backToAsk() {
    popHistory();
    setScreen('ask');
  }
  function goToExplanation() {
    pushHistory();
    setScreen('explanation');
  }
  function goToWbcDifferential() {
    pushHistory();
    setScreen('wbcDifferential');
  }
  function goToFollowUps() {
    pushHistory();
    setScreen('followUps');
  }
  function exploreAnotherPart() {
    pushHistory();
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
  const stepIdx =
    screen === 'faq' || screen === 'doctorQuestions' || screen === 'whyMeasured' ? SCREEN_STEP.ask : SCREEN_STEP[screen];
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

  const activeParam = selectedParam || param;
  let gaugePercent = 0;
  let flagColor = '#27AE60';
  let flagBg = '#E9F7EF';
  let resultStatusLine = '';
  let paramValueLine = '';
  let paramRangeLine = '';
  let resultHeading = '';
  let paramDesc = '';
  if (activeParam) {
    gaugePercent = gaugePercentFor(activeParam);
    flagColor = flagColorFor(activeParam.flag);
    flagBg = flagBgFor(activeParam.flag);
    resultHeading = selectedParam ? selectedParam.label : CATEGORY_TITLE[category] || '';
    paramDesc = category ? CATEGORY_TAGLINES[category] : '';
    resultStatusLine = `Your result is ${t[activeParam.flag]} the reference range.`;
    paramValueLine = `${activeParam.value} ${activeParam.unit}`;
    paramRangeLine = `${activeParam.low}–${activeParam.high} ${activeParam.unit}`;
  }
  const paramId = selectedParam ? selectedParam.id : CATEGORY_PRIMARY_PARAM_ID[category];
  const paramShortLabel = selectedParam ? selectedParam.label : CATEGORY_SHORT_LABEL[category] || '';

  const askOptionDefs = [
    { icon: '💬', label: t.askWhatMeans, onClick: () => goToExplanation(), showSpeaker: true, speakText: t.askWhatMeans },
    { icon: '💬', label: t.askWhyMeasured, onClick: () => goToWhyMeasured(), showSpeaker: true, speakText: t.askWhyMeasured },
    { icon: '💬', label: t.askAskDoctor, onClick: () => goToDoctorQuestions(), showSpeaker: true, speakText: t.askAskDoctor },
    { icon: '🎙️', label: t.askOwnWords, onClick: () => goToFaq(), showSpeaker: true, speakText: t.askOwnWords },
    { icon: '📋', label: t.askFollowUps, onClick: () => goToFollowUps(), showSpeaker: true, speakText: t.askFollowUps },
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

  const showAskTranscript = askListening || !!askTranscript;

  let greenIdx = 0;
  const wbcDifferentialSegments = WBC_DIFFERENTIAL.map((seg) => {
    const name = subParamLabel(seg.id);
    let color;
    if (seg.flag === 'within') {
      color = WBC_NORMAL_GREENS[greenIdx % WBC_NORMAL_GREENS.length];
      greenIdx += 1;
    } else {
      color = seg.flag === 'above' ? WBC_HIGH_COLOR : WBC_LOW_COLOR;
    }
    const suffix = seg.flag === 'above' ? ' (↑)' : seg.flag === 'below' ? ' (↓)' : '';
    return { id: seg.id, label: `${name} ${seg.value}%${suffix}`, value: seg.value, color };
  });

  const wbcAbnormalRows = WBC_DIFFERENTIAL.filter((seg) => seg.flag !== 'within').map((seg) => {
    const isHigh = seg.flag === 'above';
    return {
      id: seg.id,
      dot: isHigh ? '🔴' : '🟡',
      name: subParamLabel(seg.id),
      valueLine: `${seg.value}% (${isHigh ? t.wbcDiffHighWord : t.wbcDiffLowWord})`,
      rangeLine: `${t.wbcDiffNormalWord} ${seg.low}–${seg.high}%`,
      color: isHigh ? WBC_HIGH_COLOR : WBC_LOW_COLOR,
      bg: isHigh ? WBC_HIGH_BG : WBC_LOW_BG,
    };
  });

  const followUpsSections = followUpsSectionsData().map((section) => ({
    ...section,
    speak: () => speak([section.heading, ...section.items].join('. '), lang.code),
  }));

  return (
    <PhoneFrame
      showProgress={screen !== 'lang' && screen !== 'opening'}
      progressSteps={progressSteps}
      topBar={
        screen !== 'lang' && screen !== 'opening' ? (
          <TopNavBar onBack={goBack} languageLabel={`Voice: ${lang.short}`} onLanguageClick={goToLangScreen} />
        ) : null
      }
    >
      {screen === 'lang' && <LangScreen languages={languages} />}

      {screen === 'opening' && (
        <OpeningScreen
          languageLabel={lang.label}
          t={t}
          patientReportLabel={t.patientReportLabel}
          exploreReport={exploreReport}
          listenToReport={listenToReport}
          audioMode={audioMode}
          enableAudioMode={enableAudioMode}
          langCode={lang.code}
          onBack={goBack}
          onLanguageClick={goToLangScreen}
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
          goToParamResult={goToParamResult}
          audioMode={audioMode}
          langCode={lang.code}
          goToFaq={goToFaq}
          goToAsk={goToAsk}
        />
      )}

      {screen === 'result' && (
        <ResultScreen
          flagColor={flagColor}
          resultHeading={resultHeading}
          paramDesc={paramDesc}
          t={t}
          gaugePercent={gaugePercent}
          flagBg={flagBg}
          paramValueLine={paramValueLine}
          paramRangeLine={paramRangeLine}
          goToAsk={goToAsk}
          goToSaved={goToSaved}
          showWbcBreakdown={category === 'wbc'}
          goToWbcBreakdown={goToWbcDifferential}
          category={category}
          paramId={paramId}
          paramShortLabel={paramShortLabel}
          audioMode={audioMode}
          langCode={lang.code}
          languageLabel={lang.label}
        />
      )}

      {screen === 'wbcDifferential' && (
        <WBCDifferentialScreen
          backToResult={backToResult}
          t={t}
          segments={wbcDifferentialSegments}
          centerLabel={t.wbcDiffCenterLabel}
          abnormalRows={wbcAbnormalRows}
          feedbackGiven={feedbackGiven}
          giveFeedback={giveFeedback}
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

      {screen === 'followUps' && <FollowUpsScreen backToAsk={backToAsk} t={t} sections={followUpsSections} />}

      {screen === 'faq' && <FAQScreen backToConcept={backToConcept} />}

      {screen === 'doctorQuestions' && <DoctorQuestionsScreen t={t} langCode={lang.code} />}

      {screen === 'whyMeasured' && <WhyMeasuredScreen category={category} langCode={lang.code} t={t} />}

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
