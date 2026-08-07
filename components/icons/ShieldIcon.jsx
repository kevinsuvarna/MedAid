export default function ShieldIcon({ color = '#4CAF50' }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24">
      <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" fill={color} />
      <path d="M8.5 12 L11 14.5 L16 9" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
