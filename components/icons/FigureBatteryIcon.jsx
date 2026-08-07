export default function FigureBatteryIcon({ color = '#4CAF50' }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24">
      <circle cx={9} cy={6} r={3} fill={color} />
      <path d="M4 21 C4 15 6 12 9 12 C12 12 14 15 14 21 Z" fill={color} />
      <rect x={16} y={9} width={6} height={10} rx={1.5} fill="none" stroke={color} strokeWidth={1.5} />
      <rect x={18.5} y={7.5} width={1} height={1.5} fill={color} />
      <rect x={17.5} y={12} width={4} height={5} fill={color} />
    </svg>
  );
}
