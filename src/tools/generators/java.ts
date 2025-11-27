// 📄 路徑：src/tools/generators/java.ts
import { buildSchemas, FieldInfo, toPascal, toCamel } from "./unified-helper";

function mapJavaType(f: FieldInfo) {
  if (f.type === "string") return "String";
  if (f.type === "number") return "Double";
  if (f.type === "boolean") return "Boolean";
  if (f.type === "array") return "List<Object>";
  if (f.type === "object") return `${f.raw}`;
  return "Object";
}

export function generateJavaModel(rootName: string, json: any) {
  const schemas = buildSchemas(rootName, json);
  const parts: string[] = [];
  for (const clsName of Object.keys(schemas)) {
    const s = schemas[clsName];
    const lines = s.fields.map(f => `  private ${mapJavaType(f)} ${toCamel(f.name)};`).join("\n");
    const getters = s.fields.map(f => {
      const type = mapJavaType(f);
      const prop = toCamel(f.name);
      const cap = toPascal(prop);
      return `  public ${type} get${cap}() { return ${prop}; }\n  public void set${cap}(${type} ${prop}) { this.${prop} = ${prop}; }`;
    }).join("\n\n");
    const cls = `public class ${clsName} {
${lines}

${getters}
}`;
    parts.push(cls);
  }
  return parts.join("\n\n");
}