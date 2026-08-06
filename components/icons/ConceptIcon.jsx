export default function ConceptIcon({ category }) {
  if (category === 'rbc') {
    return (
      <svg width={190} height={170} viewBox="0 0 190 170" style={{ animation: 'floatY 3s ease-in-out infinite' }}>
        <path d="M75 30 C40 30 25 60 25 95 C25 130 45 150 70 150 C85 150 90 130 90 110 L90 55 C90 40 85 30 75 30 Z" fill="#E8746A" />
        <path d="M115 30 C150 30 165 60 165 95 C165 130 145 150 120 150 C105 150 100 130 100 110 L100 55 C100 40 105 30 115 30 Z" fill="#C0392B" />
        <line x1={95} y1={10} x2={95} y2={40} stroke="#8C4A2E" strokeWidth={5} strokeLinecap="round" />
        <path
          d="M60 60 Q75 75 60 90 Q45 105 60 120"
          stroke="#FBE4DA"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6 6"
          style={{ animation: 'dashFlow 1.6s linear infinite' }}
        />
        <path
          d="M130 60 Q145 75 130 90 Q115 105 130 120"
          stroke="#FBE4DA"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6 6"
          style={{ animation: 'dashFlow 1.6s linear infinite' }}
        />
      </svg>
    );
  }

  if (category === 'wbc') {
    const spikes = [];
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const x1 = 95 + Math.cos(ang) * 46, y1 = 85 + Math.sin(ang) * 46;
      const x2 = 95 + Math.cos(ang) * 72, y2 = 85 + Math.sin(ang) * 72;
      spikes.push(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2E86DE" strokeWidth={3} strokeLinecap="round" opacity={0.55} />
      );
    }
    return (
      <svg width={190} height={170} viewBox="0 0 190 170">
        <g style={{ animation: 'spin18 10s linear infinite', transformOrigin: '95px 85px' }}>{spikes}</g>
        <circle
          cx={95}
          cy={85}
          r={46}
          fill="#DCEBFB"
          stroke="#2E86DE"
          strokeWidth={3}
          style={{ animation: 'pulseScale 2.6s ease-in-out infinite', transformOrigin: '95px 85px' }}
        />
        <circle cx={95} cy={85} r={16} fill="#2E86DE" />
      </svg>
    );
  }

  return (
    <svg width={190} height={170} viewBox="0 0 190 170">
      <line x1={30} y1={85} x2={160} y2={85} stroke="#B7ADEE" strokeWidth={4} strokeDasharray="10 8" />
      <ellipse cx={70} cy={65} rx={16} ry={9} fill="#6C5CE7" style={{ animation: 'floatY 2.4s ease-in-out infinite' }} />
      <ellipse cx={120} cy={100} rx={14} ry={8} fill="#8577EE" style={{ animation: 'floatY 2.8s ease-in-out infinite' }} />
      <ellipse cx={95} cy={55} rx={12} ry={7} fill="#A79AF2" style={{ animation: 'floatY 2s ease-in-out infinite' }} />
      <rect x={63} y={78} width={64} height={14} rx={7} fill="#FDF6F0" stroke="#6C5CE7" strokeWidth={2} />
    </svg>
  );
}
