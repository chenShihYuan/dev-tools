// src/tools/ubn.ts
// 統一編號（UBN）檢核與產生
// 權重: [1,2,1,2,1,2,4,1]；各位數*權重後「十位+個位」相加。
// 通過條件：sum % 10 === 0
// 特例：第 7 碼為 7 時，sum % 10 === 9 也視為通過。

const WEIGHTS = [1, 2, 1, 2, 1, 2, 4, 1] as const;

function sumDigits(n: number): number {
  return Math.floor(n / 10) + (n % 10);
}

export function normalizeUBN(input: string): string {
  return input.replace(/[^0-9]/g, '').slice(0, 8);
}

export function validateUBN(ubn: string): boolean {
  const v = normalizeUBN(ubn);
  if (v.length !== 8) return false;

  const digits = v.split('').map((d) => Number(d));
  let total = 0;

  for (let i = 0; i < 8; i++) {
    const prod = digits[i] * WEIGHTS[i];
    total += sumDigits(prod);
  }

  if (total % 10 === 0) return true;
  // 特例：第 7 碼（index 6）為 7，且 sum % 10 === 9 也算通過
  return digits[6] === 7 && total % 10 === 9;
}

export function generateUBN(): string {
  // 先隨機 7 碼，再求第 8 碼（暴力尋找合法結尾）
  const digits: number[] = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10));

  for (let last = 0; last <= 9; last++) {
    const candidate = [...digits, last].join('');
    if (validateUBN(candidate)) return candidate;
  }
  // 理論上一定找得到，保險回傳一個合法固定值
  return '24536806';
}

export function generateUBNs(count = 1): string[] {
  const n = Math.max(1, Math.min(1000, Math.floor(count)));
  return Array.from({ length: n }, generateUBN);
}