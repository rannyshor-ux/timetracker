/** Convert decimal hours to HH:MM string. E.g. 1.5 → "01:30" */
export function decimalToHMS(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Parse HH:MM, HH:MM:SS, or decimal (e.g. 1.5) string to decimal hours. Returns null if invalid. */
export function hmsToDecimal(input: string): number | null {
  const trimmed = input.trim();
  // Decimal format: "1.5", "2", "0.75"
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const val = parseFloat(trimmed);
    return val >= 0 ? val : null;
  }
  // HH:MM or HH:MM:SS format
  const parts = trimmed.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parts.length === 3 ? parseInt(parts[2], 10) : 0;
  if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
  if (h < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) return null;
  return h + m / 60 + s / 3600;
}
