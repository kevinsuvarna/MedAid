export default function PhoneFrame({ showProgress, progressSteps, children }) {
  return (
    <div className="min-h-screen flex justify-center items-start py-6">
      <div className="w-[390px] min-h-[780px] bg-[#FDF6F0] rounded-[30px] overflow-hidden shadow-[0_24px_60px_rgba(26,26,46,0.22)] relative flex flex-col">
        {showProgress && (
          <div className="flex gap-[6px] px-[22px] pt-[18px]">
            {progressSteps.map((step, i) => (
              <div key={i} className="flex-1 h-[5px] rounded-[3px]" style={{ background: step.color }} />
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
