import { useEffect, useRef } from 'react';
import WBCConceptScreen, { ConceptTopChrome } from '@/components/screens/WBCConceptScreen';
import RBCConceptScreen from '@/components/screens/RBCConceptScreen';
import PlateletsConceptScreen from '@/components/screens/PlateletsConceptScreen';

const SCREEN_BY_CATEGORY = {
  wbc: WBCConceptScreen,
  rbc: RBCConceptScreen,
  plt: PlateletsConceptScreen,
};

// Matches ConceptTopChrome's own TAB_INDEX/TAB_DEFS ordering — used here only
// to decide which way the content slide-in animation should come from.
const TAB_INDEX = { rbc: 0, wbc: 1, plt: 2 };

export default function ConceptScreen({
  category,
  t,
  reportData,
  audioMode,
  langCode,
  onSelectCategory,
  goToFollowUps,
  languageLabel,
  backToOverview,
  onLanguageClick,
}) {
  const Screen = SCREEN_BY_CATEGORY[category];
  const currentIndex = TAB_INDEX[category] ?? 0;

  // Animation-only bookkeeping (not app state): remembers the previously
  // active tab index purely to pick a left/right slide-in keyframe for the
  // incoming content. Doesn't affect what's rendered or any navigation logic.
  const prevIndexRef = useRef(currentIndex);
  const direction = currentIndex > prevIndexRef.current ? 'right' : currentIndex < prevIndexRef.current ? 'left' : null;

  useEffect(() => {
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  if (!Screen) return null;

  const contentAnimation =
    direction === 'right'
      ? 'conceptSlideInFromRight 200ms ease'
      : direction === 'left'
      ? 'conceptSlideInFromLeft 200ms ease'
      : 'fadeIn 0.3s ease';

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pb-[22px]" style={{ background: '#D7E0F5' }}>
      <ConceptTopChrome
        category={category}
        onSelectCategory={onSelectCategory}
        goToFollowUps={goToFollowUps}
        languageLabel={languageLabel}
        onBack={backToOverview}
        onLanguageClick={onLanguageClick}
      />

      <div key={category} style={{ animation: contentAnimation }}>
        <Screen reportData={reportData} t={t} langCode={langCode} audioMode={audioMode} />
      </div>
    </div>
  );
}
