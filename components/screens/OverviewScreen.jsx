import CategoryIcon from '@/components/icons/CategoryIcon';
import { DETAILED_PARAMS, CATEGORY_TAGLINES } from '@/lib/data';

function borderColorFor(id) {
  const params = DETAILED_PARAMS[id] || [];
  const allNormal = params.every((p) => p.flag === 'within');
  return allNormal ? '#4CAF50' : '#F44336';
}

export default function OverviewScreen({ t, categories }) {
  return (
    <div className="flex flex-col flex-1 pt-5 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="text-[23px] font-extrabold text-[#1A1A2E] leading-[1.3]">{t.overviewTitle}</div>

      <div className="flex flex-col gap-4 mt-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-4 bg-white rounded-[20px] p-5 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.08)] relative"
            style={{ border: `2px solid ${borderColorFor(cat.id)}` }}
            onClick={cat.select}
          >
            <div className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: cat.bg }}>
              <CategoryIcon id={cat.id} />
            </div>
            <div className="flex-1">
              <div className="text-[17px] font-bold text-[#1A1A2E]">{cat.name}</div>
              <div className="text-[13.5px] text-[#6B7280] mt-[3px] font-medium">{CATEGORY_TAGLINES[cat.id]}</div>
            </div>
            <div className="text-[22px] font-bold" style={{ color: cat.accent }}>›</div>
          </div>
        ))}
      </div>

      <div className="flex-1" />
      <div className="text-center text-[13px] text-[#9CA3AF] font-semibold">{t.tapOne}</div>
    </div>
  );
}
