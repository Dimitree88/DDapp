import { Fragment } from "react";

const dieShapes: Record<number, { outline: string; facets: string[] }> = {
  4: { outline: "12,2 22,21 2,21", facets: ["12,2 12,8", "2,21 8,17", "22,21 16,17"] },
  6: { outline: "12,2 21,7 21,17 12,22 3,17 3,7", facets: ["3,7 8,9", "21,7 16,9", "3,17 8,15", "21,17 16,15"] },
  8: { outline: "12,2 21,12 12,22 3,12", facets: ["12,2 12,7", "3,12 7,12", "21,12 17,12", "12,17 12,22"] },
  10: { outline: "12,2 20,8 18,18 12,22 6,18 4,8", facets: ["12,2 12,6", "4,8 7,11", "20,8 17,11", "6,18 8,17", "18,18 16,17"] },
  12: { outline: "12,2 20,5 22,14 16,21 8,21 2,14 4,5", facets: ["4,5 8,8", "20,5 16,8", "2,14 7,14", "22,14 17,14", "8,21 9,18", "16,21 15,18"] },
  20: { outline: "12,2 21,8 21,16 12,22 3,16 3,8", facets: ["12,2 7,7", "12,2 17,7", "3,8 7,7", "21,8 17,7", "3,16 7,17", "21,16 17,17", "12,22 7,17", "12,22 17,17"] },
  100: { outline: "12,2 18,4 22,9 22,15 18,20 12,22 6,20 2,15 2,9 6,4", facets: ["6,4 8,7", "18,4 16,7", "2,15 6,15", "22,15 18,15", "6,20 8,18", "18,20 16,18"] },
};

export function DiceIcon({ sides }: { sides: number }) {
  const shape = dieShapes[sides];
  if (!shape) return <span>d{sides}</span>;
  return <svg viewBox="0 0 24 24" className="inline-block h-[1.65em] w-[1.65em] shrink-0 align-middle" aria-hidden="true">
    <polygon points={shape.outline} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    {shape.facets.map((line) => <polyline key={line} points={line} fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />)}
    <text x="12" y="14.4" textAnchor="middle" fontSize={sides === 100 ? "6.5" : sides >= 10 ? "8" : "9"} fontWeight="700" fill="currentColor">{sides}</text>
  </svg>;
}

export function DiceText({ text }: { text: string }) {
  const dice = /\b(\d*)d(100|20|12|10|8|6|4)\b/gi;
  const parts = [];
  let from = 0;
  for (const match of text.matchAll(dice)) {
    const index = match.index;
    if (index > from) parts.push(text.slice(from, index));
    const count = match[1];
    const sides = Number(match[2]);
    parts.push(<span key={index} className="inline-flex items-center align-middle whitespace-nowrap" role="img" aria-label={`${count || 1} ${Number(count || 1) === 1 ? "dado" : "dadi"} a ${sides} facce`}>
      {count && count !== "1" && <span aria-hidden="true" className="mr-0.5">{count}×</span>}
      <DiceIcon sides={sides} />
    </span>);
    from = index + match[0].length;
  }
  if (!parts.length) return <>{text}</>;
  if (from < text.length) parts.push(text.slice(from));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>;
}
