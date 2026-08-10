export default function LoadingScreen({ text = 'Reading your report…' }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-[22px] text-center">
      <div className="w-10 h-10 border-[3px] border-[#F0DCD3] border-t-[#C0392B] rounded-full animate-spin" />
      <div className="text-[15px] text-[#6B7280] font-semibold">{text}</div>
    </div>
  );
}
