import { format } from "sql-formatter";

export type SqlDialect = "sql" | "mysql" | "postgresql" | "sqlite" | "tsql";


export function formatSQL(
  sql: string,
  opts: { dialect?: SqlDialect; uppercase?: boolean; indentSize?: number; addWhere?: boolean } = {}
) { /* 先 format -> 補 WHERE 1=1 -> 再 format；回傳字串 */ 
  const { dialect = "sql", uppercase = true, indentSize = 2, addWhere = false } = opts;
  try {
    let formatted = format(sql, {
      language: dialect,
      keywordCase: uppercase ? "upper" : "lower",
      tabWidth: indentSize,
      useTabs: false,
      linesBetweenQueries: 2,
    });

    if (addWhere) {
      const regexWhere = /\bWHERE\b/i;
      if (!regexWhere.test(formatted)) {
        const regexFrom = /\bFROM\b/i;
        const fromMatch = regexFrom.exec(formatted);
        if (fromMatch) {
          const insertPos = fromMatch.index + fromMatch[0].length;
          // 在 FROM 後面換行插入，避免緊貼
          formatted = formatted.slice(0, insertPos) + "\nWHERE 1=1\n" + formatted.slice(insertPos);
        } else {
          formatted = formatted.trimEnd() + "\nWHERE 1=1\n";
        }
      } else {
        // 已有 WHERE：在第一個 WHERE 後插入 1=1 AND，避免重複加多次
        formatted = formatted.replace(/\bWHERE\b/i, "WHERE 1=1 AND");
      }
      // 再跑一次 formatter，讓 WHERE 關鍵字大小寫與縮排符合選項
      formatted = format(formatted, {
        language: dialect,
        keywordCase: uppercase ? "upper" : "lower",
        tabWidth: indentSize,
        useTabs: false,
        linesBetweenQueries: 2,
      });
    }
    return formatted;
  } catch {
    return sql;
  }
}

export function minifySQL(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}