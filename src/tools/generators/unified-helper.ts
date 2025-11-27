// 📄 路徑：src/tools/unified-helper.ts
export type FieldInfo = {
  name: string;       // 原始 key
  prop: string;       // camelCase 欄位名稱
  type: string;       // "string","number","boolean","array","object","null","any"
  raw?: any;          // 若 object/array 有子類別名稱或原始 element type
};

export type ClassSchema = {
  className: string; // PascalCase
  fields: FieldInfo[];
};

export function toPascal(s: string) {
  return s
    .toString()
    .replace(/(^|_|-|\s)+([a-zA-Z0-9])/g, (_m, _g1, g2) => g2.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

export function toCamel(s: string) {
  const p = toPascal(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

export function detectType(val: any): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  const t = typeof val;
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  if (t === "object") return "object";
  return "any";
}

/**
 * buildSchemas(rootName, obj)
 * - rootName: start class name (string)
 * - obj: parsed JSON object
 * returns: map<className, ClassSchema>
 *
 * Rules:
 * - child class name = PascalCase(propertyName)
 * - if array and first non-null element is object => child class = PascalCase(propertyName)
 * - recursion collects all classes
 */
export function buildSchemas(rootName: string, obj: any): Record<string, ClassSchema> {
  const map: Record<string, ClassSchema> = {};
  const visited = new Set<string>();

  function walk(name: string, value: any) {
    const className = toPascal(name);
    if (visited.has(className)) return;
    visited.add(className);

    const fields: FieldInfo[] = [];

    map[className] = { className, fields };
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return;
    }

    for (const key of Object.keys(value)) {
      const v = value[key];
      const t = detectType(v);
      if (t === "object") {
        const childName = toPascal(key);
        fields.push({ name: key, prop: toCamel(key), type: "object", raw: childName });
        walk(key, v);
      } else if (t === "array") {
        // find first non-null element
        let elemType = "any";
        let elemSample: any = null;
        for (const e of v) {
          if (e !== null && e !== undefined) {
            elemType = detectType(e);
            elemSample = e;
            break;
          }
        }
        if (elemType === "object" && elemSample) {
          const childName = toPascal(key);
          fields.push({ name: key, prop: toCamel(key), type: "array", raw: childName });
          walk(key, elemSample);
        } else {
          fields.push({ name: key, prop: toCamel(key), type: "array", raw: elemType });
        }
      } else {
        fields.push({ name: key, prop: toCamel(key), type: t });
      }
    }
    
  }

  walk(rootName, obj);
  return map;
}