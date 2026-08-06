import CategoryIcon from '@/components/icons/CategoryIcon';
import StatusRadial from '@/components/icons/StatusRadial';
import ThumbsUpIllustration from '@/components/icons/ThumbsUpIllustration';
import AlertSunIllustration from '@/components/icons/AlertSunIllustration';

export default function HealthPictureScreen({
  t,
  statusTier,
  statusBg,
  statusBorder,
  greeting,
  summaryLine,
  bulletLines,
  paramGroups,
  centerLabel,
  radialCategories,
  goToOverview,
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pt-5 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="text-[23px] font-extrabold text-[#1A1A2E] leading-[1.3]">{t.healthPicTitle}</div>
      <div className="text-[14px] text-[#9CA3AF] mt-1">{t.healthPicSubtitle}</div>

      <div
        className="rounded-[20px] p-5 mt-5 flex items-start gap-4"
        style={{ background: statusBg, border: `1.5px solid ${statusBorder}` }}
      >
        <div className="flex-1">
          <div className="text-[18px] font-bold text-[#1A1A2E]">{greeting}</div>
          <div className="text-[13.5px] text-[#1A1A2E] font-semibold mt-2 leading-[1.5]">{summaryLine}</div>
          <div className="flex flex-col gap-[6px] mt-3">
            {bulletLines.map((b) => (
              <div key={b.id} className="text-[13px] text-[#1A1A2E] font-medium">
                {b.icon} {b.text}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0">
          {statusTier === 'green' ? <ThumbsUpIllustration /> : <AlertSunIllustration />}
        </div>
      </div>

      <div className="text-[18px] font-bold text-[#1A1A2E] underline decoration-[#F0DCD3] underline-offset-4 mt-6">
        {t.healthPicParamsTitle}
      </div>

      <div className="flex flex-col gap-5 mt-4">
        {paramGroups.map((group) => (
          <div key={group.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 flex-shrink-0 w-[54px]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white"
                style={{ border: `2.5px solid ${group.borderColor}` }}
              >
                <CategoryIcon id={group.id} />
              </div>
              <div className="text-[9px] font-bold text-[#6B7280] text-center leading-tight">{group.caption}</div>
            </div>
            <div className="flex-1 flex flex-wrap gap-2">
              {group.pills.map((pill) => (
                <div
                  key={pill.id}
                  className="w-[calc(33.333%-6px)] rounded-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden cursor-pointer"
                  onClick={pill.onClick}
                >
                  <div className="h-1" style={{ background: pill.barColor }} />
                  <div className="px-2 py-[6px]">
                    <div className="text-[10.5px] font-bold" style={{ color: pill.barColor }}>{pill.label}</div>
                    <div className="text-[12px] font-bold text-[#1A1A2E] mt-[1px]">{pill.value}</div>
                    <div className="text-[9.5px] text-[#9CA3AF] mt-[1px]">{pill.rangeLine}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <StatusRadial centerLabel={centerLabel} categories={radialCategories} />
      </div>

      <div className="mt-6">
        <button
          className="w-full bg-[#C0392B] text-white border-none rounded-[27px] p-4 text-[16px] font-bold cursor-pointer min-h-[54px] shadow-[0_6px_18px_rgba(192,57,43,0.32)]"
          onClick={goToOverview}
        >
          {t.healthPicExploreCta}
        </button>
      </div>
    </div>
  );
}
