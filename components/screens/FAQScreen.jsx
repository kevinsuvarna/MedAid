import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'What does low haemoglobin mean?',
    a: 'It means your blood may be carrying less oxygen than usual. This can make you feel tired or short of breath.',
  },
  {
    q: 'Why is haemoglobin measured?',
    a: 'It helps doctors understand how well your blood can carry oxygen from your lungs to your body.',
  },
  {
    q: 'Is this serious?',
    a: 'It depends on how low the value is. Your doctor can tell you if you need treatment.',
  },
  {
    q: 'What foods can help?',
    a: 'Iron-rich foods like spinach, lentils, and red meat can help improve haemoglobin levels over time.',
  },
  {
    q: 'What should I ask my doctor?',
    a: 'Ask: "Do I need iron supplements?" and "Should I repeat this test?"',
  },
];

export default function FAQScreen({ backToAsk }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pt-4 px-[22px] pb-[22px]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="flex items-center gap-[10px]">
        <div className="text-[24px] text-[#6B7280] cursor-pointer p-1" onClick={backToAsk}>‹</div>
        <div className="text-[19px] font-extrabold text-[#1A1A2E]">Common Questions</div>
      </div>
      <div className="text-[14px] text-[#9CA3AF] mt-[6px] ml-[38px] font-medium">Tap a question to see the answer</div>

      <div className="flex flex-col gap-3 mt-5">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-4 cursor-pointer"
              style={isOpen ? { borderLeft: '4px solid #C0392B' } : undefined}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-semibold text-[#1A1A2E]">{item.q}</span>
                <span
                  className="text-[14px] text-[#9CA3AF] flex-shrink-0 transition-transform"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ▾
                </span>
              </div>
              {isOpen && (
                <div className="text-[13.5px] text-[#6B7280] font-medium leading-[1.5] mt-3">{item.a}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
