export default function PhoneFrame({ showProgress, progressSteps, topBar, children }) {
  return (
    <div className="w-full min-h-screen bg-[#FDF6F0] relative flex flex-col">
      {topBar}
      {showProgress && (
        <div className="flex gap-[6px] px-[22px] pt-[18px]">
          {progressSteps.map((step, i) => (
            <div key={i} className="flex-1 h-[5px] rounded-[3px]" style={{ background: step.color }} />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
