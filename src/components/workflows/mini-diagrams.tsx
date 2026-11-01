// Tiny decorative diagrams for the capability cards (aria-hidden; the card text carries the meaning).

const node = "fill-white stroke-[#E8DFF5]";

export function AgentMini() {
  return (
    <svg viewBox="0 0 220 120" className="h-full max-h-32 w-full" aria-hidden>
      <path d="M40 60 H95" className="mini-dash" stroke="#B89CFF" strokeWidth="2.5" fill="none" />
      <path d="M125 60 H180" className="mini-dash" stroke="#7300FF" strokeWidth="2.5" fill="none" />
      <rect x="12" y="44" width="34" height="32" rx="10" className={node} strokeWidth="2" />
      <path d="M21 56h16M21 64h10" stroke="#5E6075" strokeWidth="2.5" strokeLinecap="round" />
      <g className="mini-pulse">
        <circle cx="110" cy="60" r="26" fill="url(#mg1)" />
        <rect x="99" y="51" width="22" height="17" rx="5" fill="#fff" />
        <circle cx="105" cy="59.5" r="2" fill="#7300FF" />
        <circle cx="115" cy="59.5" r="2" fill="#7300FF" />
      </g>
      <circle cx="194" cy="60" r="15" fill="#7300FF" />
      <path d="M187 60l5 5 9-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="mg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7300FF" />
          <stop offset="1" stopColor="#B89CFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TeamMini() {
  const pts = [
    [110, 22],
    [45, 98],
    [175, 98],
  ];
  return (
    <svg viewBox="0 0 220 120" className="h-full max-h-32 w-full" aria-hidden>
      <path d="M110 22 L45 98 L175 98 Z" className="mini-dash" stroke="#B89CFF" strokeWidth="2.5" fill="none" />
      {pts.map(([x, y], i) => (
        <g key={i} className="mini-blink" style={{ animationDelay: `${i * 0.8}s` }}>
          <circle cx={x} cy={y} r="17" fill={i === 0 ? "#7300FF" : "#fff"} stroke="#B89CFF" strokeWidth="2" />
          <rect x={x - 7} y={y - 5} width="14" height="10" rx="3" fill={i === 0 ? "#fff" : "#7300FF"} />
        </g>
      ))}
      <circle cx="110" cy="72" r="6" fill="#B89CFF" className="mini-pulse" />
    </svg>
  );
}

export function AutomationMini() {
  const xs = [26, 82, 138, 194];
  const fills = ["#fff", "#7300FF", "#fff", "#7300FF"];
  return (
    <svg viewBox="0 0 220 120" className="h-full max-h-32 w-full" aria-hidden>
      <path d="M26 60 C 54 20, 54 20, 82 60 S 110 100, 138 60 S 166 20, 194 60" className="mini-dash" stroke="#7300FF" strokeWidth="2.5" fill="none" />
      {xs.map((x, i) => (
        <g key={x} className="mini-blink" style={{ animationDelay: `${i * 0.6}s` }}>
          <rect x={x - 15} y="45" width="30" height="30" rx="9" fill={fills[i]} stroke="#B89CFF" strokeWidth="2" />
        </g>
      ))}
      <path d="M131 60h14M138 53v14" stroke="#7300FF" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="26" cy="60" r="5" fill="#B89CFF" />
      <path d="M188 60l4 4 8-9" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="82" cy="60" r="5" fill="#fff" />
    </svg>
  );
}
