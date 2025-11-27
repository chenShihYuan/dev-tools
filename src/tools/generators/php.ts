// 📄 路徑：src/tools/generators/php.ts
import { buildSchemas, FieldInfo } from "./unified-helper";

export function generatePHPModel(rootName: string, json: any) {
  const schemas = buildSchemas(rootName, json);
  const parts: string[] = [];
  for (const clsName of Object.keys(schemas)) {
    const s = schemas[clsName];
    const lines = s.fields.map(f => `  public $${f.prop};`).join("\n");
    parts.push(`class ${clsName} {
${lines}
}`);
  }
  return parts.join("\n\n");
}