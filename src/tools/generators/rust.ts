// 📄 路徑：src/tools/generators/rust.ts
import { buildSchemas, FieldInfo } from "./unified-helper";

function mapRustType(f: FieldInfo) {
  if (f.type === "string") return "Option<String>";
  if (f.type === "number") return "Option<f64>";
  if (f.type === "boolean") return "Option<bool>";
  if (f.type === "array") return "Option<Vec<serde_json::Value>>";
  if (f.type === "object") return `Option<${f.raw}>`;
  return "Option<serde_json::Value>";
}

export function generateRustModel(rootName: string, json: any) {
  const schemas = buildSchemas(rootName, json);
  const parts: string[] = [];
  for (const clsName of Object.keys(schemas)) {
    const s = schemas[clsName];
    const lines = s.fields.map(f => `    pub ${f.prop}: ${mapRustType(f)},`).join("\n");
    parts.push(`use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ${clsName} {
${lines}
}`);
  }
  return parts.join("\n\n");
}