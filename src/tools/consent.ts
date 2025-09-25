// src/tools/consent.ts
export function validateConsent(code: string): boolean {
  const regex = /^\d{5}[ABCD]\d{6}$/;
  return regex.test(code);
}

export function generateConsent(prefix: string, seq: number): string {
  // prefix: 民國年月 (5 碼，例如 11409)
  // seq: 流水號 (整數，會補足 6 碼)
  const letters = ['A', 'B', 'C', 'D'];
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const serial = seq.toString().padStart(6, '0');
  return `${prefix}${letter}${serial}`;
}