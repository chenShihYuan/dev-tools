// src/tools/timestamp.ts

// 預設台北時區 +8
export const DEFAULT_TZ_OFFSET_HOURS = 8;
const HOUR = 3600 * 1000;

// Unix timestamp → ISO 字串（依 offset 計算）
export function toISOOffset(ts: number, offsetHours: number = DEFAULT_TZ_OFFSET_HOURS): string {
  const ms = (ts < 1e12 ? ts * 1000 : ts) + offsetHours * HOUR; // 支援秒或毫秒
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  const Y = d.getUTCFullYear();
  const M = pad(d.getUTCMonth() + 1);
  const D = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const m = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

// ISO 字串（視為 offset 時區的本地時間）→ Unix 秒
export function fromISOOffset(iso: string, offsetHours: number = DEFAULT_TZ_OFFSET_HOURS): number {
  const s = iso.trim().replace("T", " ");
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!m) {
    const t = Date.parse(iso);
    return Number.isFinite(t) ? Math.floor(t / 1000) : NaN;
  }
  const [, y, mo, d, h, mi, se] = m;
  const msUTC = Date.UTC(+y, +mo - 1, +d, +h, +mi, +se) - offsetHours * HOUR;
  return Math.floor(msUTC / 1000);
}

// 與既有名稱相容（預設台北 +8）
export function toISO(ts: number, offsetHours: number = DEFAULT_TZ_OFFSET_HOURS): string {
  return toISOOffset(ts, offsetHours);
}
export function toUnix(iso: string, offsetHours: number = DEFAULT_TZ_OFFSET_HOURS): number {
  return fromISOOffset(iso, offsetHours);
}