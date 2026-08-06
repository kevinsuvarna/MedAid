export default function CategoryIcon({ id }) {
  if (id === 'rbc') {
    return (
      <svg width={30} height={30} viewBox="0 0 30 30">
        <circle cx={15} cy={15} r={13} fill="#C0392B" />
        <ellipse cx={15} cy={15} rx={6} ry={4.2} fill="#E8746A" />
      </svg>
    );
  }
  if (id === 'wbc') {
    const spikes = [];
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      const x1 = 15 + Math.cos(ang) * 11, y1 = 15 + Math.sin(ang) * 11;
      const x2 = 15 + Math.cos(ang) * 14.5, y2 = 15 + Math.sin(ang) * 14.5;
      spikes.push(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2E86DE" strokeWidth={2} strokeLinecap="round" />
      );
    }
    return (
      <svg width={30} height={30} viewBox="0 0 30 30">
        {spikes}
        <circle cx={15} cy={15} r={10} fill="#DCEBFB" stroke="#2E86DE" strokeWidth={1.5} />
        <circle cx={15} cy={15} r={4} fill="#2E86DE" />
      </svg>
    );
  }
  return (
    <svg width={30} height={30} viewBox="0 0 30 30">
      <ellipse cx={11} cy={12} rx={6} ry={3.6} fill="#6C5CE7" />
      <ellipse cx={19} cy={18} rx={5} ry={3} fill="#8577EE" />
      <ellipse cx={12} cy={20} rx={4} ry={2.4} fill="#A79AF2" />
    </svg>
  );
}
