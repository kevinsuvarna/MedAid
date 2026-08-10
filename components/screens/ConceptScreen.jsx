import WBCConceptScreen from '@/components/screens/WBCConceptScreen';
import RBCConceptScreen from '@/components/screens/RBCConceptScreen';
import PlateletsConceptScreen from '@/components/screens/PlateletsConceptScreen';

const SCREEN_BY_CATEGORY = {
  wbc: WBCConceptScreen,
  rbc: RBCConceptScreen,
  plt: PlateletsConceptScreen,
};

export default function ConceptScreen({
  category,
  t,
  reportData,
  audioMode,
  langCode,
  onSelectCategory,
  goToFollowUps,
  languageLabel,
  onBack,
  onLanguageClick,
}) {
  const Screen = SCREEN_BY_CATEGORY[category];
  if (!Screen) return null;

  return (
    <Screen
      reportData={reportData}
      t={t}
      langCode={langCode}
      audioMode={audioMode}
      onSelectCategory={onSelectCategory}
      goToFollowUps={goToFollowUps}
      languageLabel={languageLabel}
      onBack={onBack}
      onLanguageClick={onLanguageClick}
    />
  );
}
