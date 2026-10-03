export type NumericMode = "unsigned" | "signed" | "dice";

export function numericDraftValid(value: string, mode: NumericMode): boolean {
  if (mode === "dice") return /^\d*[dD]?\d*$/.test(value);
  return mode === "unsigned" ? /^\d*$/.test(value) : /^[+-]?\d*$/.test(value);
}

export function numericValueValid(value: string, mode: NumericMode): boolean {
  if (value === "") return true;
  if (mode === "dice") return /^\d+[dD]\d+$/.test(value);
  return mode === "unsigned" ? /^\d+$/.test(value) : /^[+-]?\d+$/.test(value);
}
