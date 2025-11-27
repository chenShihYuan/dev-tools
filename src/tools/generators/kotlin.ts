// 📄 路徑：src/tools/generators/kotlin.ts
import { buildSchemas, FieldInfo, toPascal } from "./unified-helper";

function mapKotlinType(f: FieldInfo) {
  if (f.type === "string") return "String?";
  if (f.type === "number") return "Double?";
  if (f.type === "boolean") return "Boolean?";
  if (f.type === "array") {
    if (typeof f.raw === "string" && f.raw !== "string" && f.raw !== "number" && f.raw !== "boolean") {
      return "List<" + f.raw + ">?";
    }
    return "List<Any>?";
  }
  if (f.type === "object") return `${f.raw}?`;
  return "Any?";
}

export function generateKotlinModel(rootName: string, json: any) {
  const schemas = buildSchemas(rootName, json);
  const parts: string[] = [];

  for (const clsName of Object.keys(schemas)) {
    const s = schemas[clsName];
    const props = s.fields.map(f => `    var ${f.prop}: ${mapKotlinType(f)} = null`).join("\n");
    // to/from using Gson (users can use Gson().fromJson(jsonString, Class::class.java))
    const cls = `data class ${clsName}(
${s.fields.map(f => `    var ${f.prop}: ${mapKotlinType(f)} = null`).join(",\n")}
)`;
    parts.push(cls);
  }
  return parts.join("\n\n");
}