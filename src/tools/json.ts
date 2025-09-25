export function formatJSON(input: string): string {
  try {
    const obj = JSON.parse(input);
    return JSON.stringify(obj, null, 2);
  } catch {
    return "⚠️ JSON 格式錯誤";
  }
}

export function minifyJSON(input: string): string {
  try {
    const obj = JSON.parse(input);
    return JSON.stringify(obj);
  } catch {
    return "⚠️ JSON 格式錯誤";
  }
}