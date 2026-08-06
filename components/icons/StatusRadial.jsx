export default function StatusRadial({ centerLabel, categories }) {
  const width = 340, height = 180;
  const centerX = width / 2, centerY = 26;
  const circleY = 130;
  const r = 32;
  const xs = [60, centerX, width - 60];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {xs.map((x, i) => (
        <line
          key={'l' + i}
          x1={centerX}
          y1={centerY + 16}
          x2={x}
          y2={circleY - r}
          stroke="#E6DDD5"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      ))}

      <rect x={centerX - 62} y={centerY - 16} width={124} height={32} rx={16} fill="#FFFFFF" stroke="#F0DCD3" strokeWidth={1.5} />
      <text x={centerX} y={centerY + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1A1A2E">
        {centerLabel}
      </text>

      {categories.map((cat, i) => (
        <g key={cat.id} onClick={cat.onClick} style={{ cursor: 'pointer' }}>
          <circle cx={xs[i]} cy={circleY} r={r} fill="#FFFFFF" stroke={cat.statusColor} strokeWidth={3} />
          <circle cx={xs[i] + r - 6} cy={circleY - r + 6} r={5} fill={cat.statusColor} />
          <text x={xs[i]} y={circleY + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#1A1A2E">
            {cat.shortLabel}
          </text>
        </g>
      ))}
    </svg>
  );
}
