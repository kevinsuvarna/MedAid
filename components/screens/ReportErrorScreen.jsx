export default function ReportErrorScreen({ onRetry }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-[22px] text-center">
      <div className="w-[64px] h-[64px] rounded-full bg-[#FDEDEB] flex items-center justify-center text-[28px]">⚠</div>
      <div className="text-[16px] font-bold text-[#1A1A2E]">
        Could not read report. Please check the file and try again.
      </div>
      <button
        className="bg-[#E8735A] text-white border-none rounded-[26px] px-6 py-3 text-[15px] font-bold cursor-pointer min-h-[48px] shadow-[0_6px_18px_rgba(232,115,90,0.32)] mt-2"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}
