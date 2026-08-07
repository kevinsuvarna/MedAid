export default function BandageIcon({ color = '#4CAF50' }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24">
      <g transform="rotate(-20 12 12)">
        <rect x={2} y={9} width={20} height={6} rx={3} fill={color} />
        <circle cx={7.5} cy={9.2} r={1} fill="#FFFFFF" />
        <circle cx={9.5} cy={11.2} r={1} fill="#FFFFFF" />
        <circle cx={14.5} cy={12.8} r={1} fill="#FFFFFF" />
        <circle cx={16.5} cy={14.8} r={1} fill="#FFFFFF" />
      </g>
    </svg>
  );
}
