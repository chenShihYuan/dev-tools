// 📄 路徑：src/tools/generators/csharp.ts
import { buildSchemas, FieldInfo, toPascal } from "./unified-helper";

function mapCsharpType(f: FieldInfo) {
  if (f.type === "string") return "string";
  if (f.type === "number") return "double?";
  if (f.type === "boolean") return "bool?";
  if (f.type === "array") return "List<object>";
  if (f.type === "object") return `${f.raw}`;
  return "object";
}

export function generateCSharpModel(rootName: string, json: any) {
  const schemas = buildSchemas(rootName, json);
  const parts: string[] = [];
  for (const clsName of Object.keys(schemas)) {
    const s = schemas[clsName];
    const lines = s.fields.map(f => `    [Newtonsoft.Json.JsonProperty("${f.name}")] public ${mapCsharpType(f)} ${toPascal(f.prop)} { get; set; }`).join("\n");
    const cls = `public class ${clsName} {
${lines}
}`;
    parts.push(cls);
  }
  return parts.join("\n\n");
}