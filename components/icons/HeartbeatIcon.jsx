export default function HeartbeatIcon() {
  return (
    <svg width={120} height={56} viewBox="0 0 120 56">
      <polyline
        points="2,28 22,28 30,10 40,46 50,20 58,28 118,28"
        fill="none"
        stroke="#C0392B"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 2"
        style={{ animation: 'heartbeat 1.6s linear infinite' }}
      />
    </svg>
  );
}
