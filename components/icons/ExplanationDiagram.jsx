import { CAT_DEFS, DIAGRAM_LABELS } from '@/lib/data';

export default function ExplanationDiagram({ category, langId }) {
  if (!category) return null;

  const accent = (CAT_DEFS.find((c) => c.id === category) || {}).accent || '#C0392B';
  const labels = ((DIAGRAM_LABELS[langId] || DIAGRAM_LABELS.en)[category]) || ['', '', ''];
  const boxW = 86, boxH = 46, gap = 18, y = 12;
  const xs = [0, boxW + gap, (boxW + gap) * 2];
  const lineHeight = 12;

  const nodes = xs.map((x, i) => {
    const words = String(labels[i]).split(' ');
    const startY = y + boxH / 2 - ((words.length - 1) * lineHeight) / 2 + 4;
    return (
      <g key={'n' + i}>
        <rect x={x} y={y} width={boxW} height={boxH} rx={14} fill={accent + '1A'} stroke={accent} strokeWidth={1.5} />
        <text x={x + boxW / 2} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={accent}>
          {words.map((w, wi) => (
            <tspan key={wi} x={x + boxW / 2} y={startY + wi * lineHeight}>
              {w}
            </tspan>
          ))}
        </text>
      </g>
    );
  });

  const arrows = [0, 1].map((i) => {
    const x1 = xs[i] + boxW, x2 = xs[i + 1];
    const yc = y + boxH / 2;
    return (
      <g key={'a' + i}>
        <line
          x1={x1 + 3}
          y1={yc}
          x2={x2 - 8}
          y2={yc}
          stroke={accent}
          strokeWidth={2}
          strokeDasharray="5 4"
          style={{ animation: 'dashFlow 1.4s linear infinite' }}
        />
        <path
          d={`M${x2 - 11} ${yc - 5} L${x2 - 3} ${yc} L${x2 - 11} ${yc + 5}`}
          fill="none"
          stroke={accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  });

  const totalW = xs[2] + boxW, totalH = y * 2 + boxH;
  return (
    <svg width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`}>
      {nodes}
      {arrows}
    </svg>
  );
}
