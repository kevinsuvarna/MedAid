const screens = [
  { slug: 'lang', label: 'Language Select' },
  { slug: 'opening', label: 'Opening' },
  { slug: 'overview', label: 'Health Picture Overview' },
  { slug: 'concept', label: 'Concept (RBC)' },
  { slug: 'result', label: 'Result (RBC)' },
  { slug: 'wbc-differential', label: 'WBC Differential' },
  { slug: 'ask', label: 'Ask' },
  { slug: 'follow-ups', label: 'Follow Ups' },
  { slug: 'faq', label: 'FAQ' },
  { slug: 'doctor-questions', label: 'Doctor Questions' },
  { slug: 'why-measured', label: 'Why Measured' },
  { slug: 'explanation', label: 'Explanation' },
  { slug: 'saved', label: 'Saved' },
];

export default function Page() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '16px' }}>MedAid — All Screens</h1>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {screens.map((s) => (
          <li key={s.slug}>
            <a
              href={`/export/${s.slug}.html`}
              style={{ display: 'block', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', textDecoration: 'none', color: '#111' }}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
