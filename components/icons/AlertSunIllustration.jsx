export default function AlertSunIllustration() {
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const x1 = 36 + Math.cos(ang) * 18;
    const y1 = 36 + Math.sin(ang) * 18;
    const x2 = 36 + Math.cos(ang) * 25;
    const y2 = 36 + Math.sin(ang) * 25;
    rays.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F39C12" strokeWidth={2.5} strokeLinecap="round" />);
  }
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={34} fill="#FFF8E1" />
      {rays}
      <circle cx={36} cy={36} r={14} fill="#F39C12" />
      <rect x={33.5} y={29} width={5} height={11} rx={2.5} fill="#FFF8E1" />
      <circle cx={36} cy={43} r={2.4} fill="#FFF8E1" />
    </svg>
  );
}
