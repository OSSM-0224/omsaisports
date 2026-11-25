import Reveal from "../components/Reveal";

const steps = [
  ["01", "Design", "Your colours, your identity. We shape the idea with you."],
  ["02", "Sublimation printing", "Sharp details and colours made to stay."],
  ["03", "Stitching", "Every panel comes together with care."],
  ["04", "Quality check & delivery", "Checked by hand, ready for the team."]
];

function StepIcon({ step }: { step: number }) {
  if (step === 1) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M13 51l5-17 19-19 12 12-19 19-17 5Z" />
        <circle cx="23" cy="41" r="3" />
        <path d="m32 20 12 12" />
      </svg>
    );
  }
  if (step === 2) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M20 8c0 2.5 3 2.5 3 5M32 6c0 2.5 3 2.5 3 5M44 8c0 2.5 3 2.5 3 5" />
        <rect x="12" y="17" width="40" height="13" rx="2" />
        <path d="M18 30v6M46 30v6M32 30v6" />
        <path d="m28 33 4 4 4-4" />
        <rect x="14" y="40" width="36" height="14" rx="2" />
        <path d="M22 47h12" />
      </svg>
    );
  }
  if (step === 3) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M14 52V15M50 52V15" />
        <path d="M32 11v42" strokeDasharray="3 5" />
        <path d="M49 9l7 7-7 7-7-7 7-7Z" />
        <circle cx="49" cy="16" r="1.6" />
        <path d="M43 23c-9 8-13-3-21 6s-10 8-14 4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M32 9 52 16v13c0 11-8 19-20 25-12-6-20-14-20-25V16l20-7Z" />
      <path d="m23 31 6 6 13-14" />
    </svg>
  );
}

export default function Process() {
  return (
    <section className="section process-section">
      <Reveal><h2>Good things take<br /><em>teamwork.</em></h2></Reveal>
      <div className="steps">
        {steps.map(([n, t, d], i) => (
          <Reveal key={n}>
            <div className="step-card">
              <span>{n}</span>
              <div className={`step-art art-${i + 1}`}><StepIcon step={i + 1} /></div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
