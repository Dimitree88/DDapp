const italianCollator = new Intl.Collator("it", { sensitivity: "base", numeric: true });

export function compareOptionLabels(a: string, b: string): number {
  return italianCollator.compare(a, b);
}
