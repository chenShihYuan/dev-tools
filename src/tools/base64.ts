export function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

export function decodeBase64(base64: string): string {
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch {
    return "⚠️ 無效的 Base64 字串";
  }
}