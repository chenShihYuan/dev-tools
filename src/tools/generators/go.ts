// 📄 路徑：src/tools/generators/go.ts
import { buildSchemas, FieldInfo, toPascal } from "./unified-helper";

function mapGoType(f: FieldInfo) {
  if (f.type === "string") return "string";
  if (f.type === "number") return "float64";
  if (f.type === "boolean") return "bool";
  if (f.type === "array") return "[]interface{}";
  if (f.type === "object") return `${f.raw}`;
  return "interface{}";
}

export function generateGoModel(rootName: string, json: any) {
  const schemas = buildSchemas(rootName, json);
  const parts: string[] = [];
  for (const clsName of Object.keys(schemas)) {
    const s = schemas[clsName];
    const lines = s.fields.map(f => `    ${toPascal(f.name)} ${mapGoType(f)} \`json:"${f.name}"\``).join("\n");
    parts.push(`type ${clsName} struct {
${lines}
}`);
  }
  return parts.join("\n\n");
}