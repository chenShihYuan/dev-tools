// 📄 路徑：src/tools/generators/python.ts
import { buildSchemas, FieldInfo, toPascal, toCamel } from "./unified-helper";

function mapPyType(f: FieldInfo) {
  if (f.type === "string") return "str | None";
  if (f.type === "number") return "float | None";
  if (f.type === "boolean") return "bool | None";
  if (f.type === "array") return "list | None";
  if (f.type === "object") return `${f.raw} | None`;
  return "Any | None";
}

export function generatePythonModel(rootName: string, json: any) {
  const schemas = buildSchemas(rootName, json);
  const parts: string[] = [];
  for (const clsName of Object.keys(schemas)) {
    const s = schemas[clsName];
    const lines = s.fields.map(f => `    ${f.prop}: ${mapPyType(f)} = None`).join("\n");
    parts.push(`from dataclasses import dataclass
from typing import Any

@dataclass
class ${clsName}:
${lines}
`);
  }
  return parts.join("\n");
}