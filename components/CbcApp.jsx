'use client';

import { useEffect, useState } from 'react';
import { LANG_META, T } from '@/lib/translations';
import { CAT_DEFS, PARAMS, SCREEN_STEP, FACTS, WBC_DIFFERENTIAL, DETAILED_PARAMS } from '@/lib/data';
import { speak, stopSpeech, startVoiceInput as startVoiceInputHelper } from '@/lib/speech';
import PhoneFrame from '@/components/PhoneFrame';
import LangScreen from '@/components/screens/LangScreen';
import OpeningScreen from '@/components/screens/OpeningScreen';
import HealthPictureScreen from '@/components/screens/HealthPictureScreen';
import OverviewScreen from '@/components/screens/OverviewScreen';
import ConceptScreen from '@/components/screens/ConceptScreen';
import ResultScreen from '@/components/screens/ResultScreen';
import WBCDifferentialScreen from '@/components/screens/WBCDifferentialScreen';
import AskScreen from '@/components/screens/AskScreen';
import ExplanationScreen from '@/components/screens/ExplanationScreen';
import FollowUpsScreen from '@/components/screens/FollowUpsScreen';
import SavedScreen from '@/components/screens/SavedScreen';

const WBC_NORMAL_GREENS = ['#2ECC71', '#27AE60', '#1E8449'];
const WBC_HIGH_COLOR = '#E74C3C';
const WBC_LOW_COLOR = '#E67E22';
const WBC_LOW_BG = '#FFF8E1';
const WBC_HIGH_BG = '#FDEDEB';

function fillTemplate(str, replacements) {
  return Object.keys(replacements).reduce((acc, key) => acc.split(`{${key}}`).join(replacements[key]), str);
}

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

  function formatValueUnit(value, unit) {
    return unit === '%' ? `${value}%` : `${value} ${unit}`;
  }

  function healthPictureTier() {
    const abnormalCount = CAT_DEFS.filter((c) => PARAMS[c.id].flag !== 'within').length;
    if (abnormalCount === 0) return 'green';
    if (abnormalCount <= 2) return 'amber';
    return 'red';
  }

  function healthPictureBulletText(id) {
    const flag = PARAMS[id].flag;
    const name = categoryName(id);
    if (flag === 'within') return fillTemplate(t.healthPicNormalLine, { name });
    return fillTemplate(t.healthPicAbnormalLine, { name, flag: t[flag] });
  }

  function healthPictureSummaryLine(tier) {
    if (tier === 'green') return t.healthPicSummaryGreen;
    if (tier === 'amber') return t.healthPicSummaryAmber;
    return t.healthPicSummaryRed;
  }

  function healthPictureNarrationText() {
    const tier = healthPictureTier();
    const bullets = CAT_DEFS.map((c) => healthPictureBulletText(c.id));
    return [t.healthPicGreeting, healthPictureSummaryLine(tier), ...bullets].join('. ');
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
    } else if (screen === 'healthPicture') {
      speak(healthPictureNarrationText(), lang.code);
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
    setScreen('healthPicture');
  }
  function goToOverview() {
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
  function goToWbcDifferential() {
    setScreen('wbcDifferential');
  }
  function goToFollowUps() {
    setScreen('followUps');
  }
  function goToResultDirect(id) {
    setCategory(id);
    setScreen('result');
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

  const numbersToggleLabel = showNumbers ? t.hideNumbers : t.seeNumbers;
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

  const healthPicTier = healthPictureTier();
  const healthPicStatusColors = {
    green: { bg: '#E8F5E9', border: '#27AE60' },
    amber: { bg: '#FFF8E1', border: '#F39C12' },
    red: { bg: '#FFEBEE', border: '#E74C3C' },
  }[healthPicTier];
  const healthPicBullets = CAT_DEFS.map((c) => ({
    id: c.id,
    icon: PARAMS[c.id].flag === 'within' ? '✓' : '⚠',
    text: healthPictureBulletText(c.id),
  }));

  const detailedParamGroups = CAT_DEFS.map((c) => {
    const pills = DETAILED_PARAMS[c.id].map((p) => ({
      id: p.id,
      label: subParamLabel(p.id),
      value: formatValueUnit(p.value, p.unit),
      rangeLine: `${p.low}–${p.high}${p.unit === '%' ? '%' : ' ' + p.unit}`,
      flag: p.flag,
      barColor: p.flag === 'within' ? '#4CAF50' : '#F44336',
      onClick: () => goToResultDirect(c.id),
    }));
    const abnormalInGroup = pills.filter((p) => p.flag !== 'within').length;
    const borderColor = abnormalInGroup === 0 ? '#4CAF50' : abnormalInGroup === 1 ? '#FFC107' : '#F44336';
    const caption = c.id === 'rbc' ? t.captionRbc : c.id === 'wbc' ? t.captionWbc : t.captionPlt;
    return { id: c.id, caption, borderColor, pills };
  });

  const radialCategories = CAT_DEFS.map((c) => ({
    id: c.id,
    shortLabel: c.id.toUpperCase(),
    statusColor: flagColorFor(PARAMS[c.id].flag),
    onClick: () => selectCategory(c.id),
  }));

  const followUpsSections = followUpsSectionsData().map((section) => ({
    ...section,
    speak: () => speak([section.heading, ...section.items].join('. '), lang.code),
  }));

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

      {screen === 'healthPicture' && (
        <HealthPictureScreen
          t={t}
          statusTier={healthPicTier}
          statusBg={healthPicStatusColors.bg}
          statusBorder={healthPicStatusColors.border}
          greeting={t.healthPicGreeting}
          summaryLine={healthPictureSummaryLine(healthPicTier)}
          bulletLines={healthPicBullets}
          paramGroups={detailedParamGroups}
          centerLabel={t.healthPicReportCenterLabel}
          radialCategories={radialCategories}
          goToOverview={goToOverview}
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
          showWbcBreakdown={category === 'wbc'}
          goToWbcBreakdown={goToWbcDifferential}
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
