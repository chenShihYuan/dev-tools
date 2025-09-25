// src/tools/json.ts
export function formatJSON(input: string): string {
  try {
    const obj = JSON.parse(input);
    return JSON.stringify(obj, null, 2); // 美化
  } catch {
    return "⚠️ JSON 格式錯誤";
  }
}

export function minifyJSON(input: string): string {
  try {
    const obj = JSON.parse(input);
    return JSON.stringify(obj); // 壓縮
  } catch {
    return "⚠️ JSON 格式錯誤";
  }
}

export function tryParse(input: string): { ok: boolean; value?: unknown; error?: string } {
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "JSON 解析失敗" };
  }
}