export default function WBCDonutChart({ segments, centerLabel }) {
  const cx = 150, cy = 125, r = 62, strokeWidth = 30;
  const circumference = 2 * Math.PI * r;
  const gap = 3;
  const labelRadius = r + strokeWidth / 2 + 10;

  let cumulative = 0;
  const arcs = [];
  const labels = [];

  segments.forEach((seg) => {
    const arcLen = (seg.value / 100) * circumference;
    const dash = Math.max(arcLen - gap, 0);

    arcs.push(
      <circle
        key={seg.id}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-cumulative}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );

    const midAngleDeg = -90 + ((cumulative + arcLen / 2) / circumference) * 360;
    const midAngleRad = (midAngleDeg * Math.PI) / 180;
    const lx = cx + labelRadius * Math.cos(midAngleRad);
    const ly = cy + labelRadius * Math.sin(midAngleRad);
    const cos = Math.cos(midAngleRad);
    const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';

    labels.push(
      <text key={seg.id + '-label'} x={lx} y={ly} textAnchor={anchor} fontSize={9.5} fontWeight={700} fill={seg.color}>
        {seg.label}
      </text>
    );

    cumulative += arcLen;
  });

  return (
    <svg width={300} height={260} viewBox="0 0 300 260">
      {arcs}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight={700} fill="#1A1A2E">
        {centerLabel}
      </text>
      {labels}
    </svg>
  );
}
