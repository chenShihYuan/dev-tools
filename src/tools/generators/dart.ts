// 📄 路徑：src/tools/generators/dart.ts
import { buildSchemas, ClassSchema, FieldInfo } from "./unified-helper";

function mapDartType(f: FieldInfo) {
  if (f.type === "string") return "String?";
  if (f.type === "number") return "num?";
  if (f.type === "boolean") return "bool?";
  if (f.type === "array") {
    if (typeof f.raw === "string" && f.raw !== "string" && f.raw !== "number" && f.raw !== "boolean") {
      return `List<${f.raw}>?`;
    }
    if (f.raw === "string") return "List<String>?";
    if (f.raw === "number") return "List<num>?";
    if (f.raw === "boolean") return "List<bool>?";
    return "List<dynamic>?";
  }
  if (f.type === "object") return `${f.raw}?`;
  return "dynamic?";
}

export function generateDartModel(rootName: string, json: any) {
  const schemas = buildSchemas(rootName, json);
  const order = Object.keys(schemas); // insertion order from builder
  const parts: string[] = [];

  for (const clsName of order) {
    const schema = schemas[clsName];
    const fieldsDecl = schema.fields.map(f => `  final ${mapDartType(f)} ${f.prop};`).join("\n");
    const ctorParams = schema.fields.map(f => `    this.${f.prop},`).join("\n");

    // fromJson
    const fromJsonLines = schema.fields.map(f => {
      if (f.type === "object") {
        return `      ${f.prop}: json['${f.name}'] != null ? ${f.raw}.fromJson(json['${f.name}']) : null,`;
      } else if (f.type === "array" && typeof f.raw === "string" && f.raw !== "string" && f.raw !== "number" && f.raw !== "boolean") {
        return `      ${f.prop}: json['${f.name}'] != null ? (json['${f.name}'] as List).map((e) => ${f.raw}.fromJson(e)).toList() : null,`;
      } else {
        return `      ${f.prop}: json['${f.name}'],`;
      }
    }).join("\n");

    // toJson
    const toJsonLines = schema.fields.map(f => {
      if (f.type === "object") {
        return `    if (${f.prop} != null) data['${f.name}'] = ${f.prop}!.toJson();`;
      } else if (f.type === "array" && typeof f.raw === "string" && f.raw !== "string" && f.raw !== "number" && f.raw !== "boolean") {
        return `    if (${f.prop} != null) data['${f.name}'] = ${f.prop}!.map((e) => e.toJson()).toList();`;
      } else {
        return `    data['${f.name}'] = ${f.prop};`;
      }
    }).join("\n");

    const cls = `class ${clsName} {
${fieldsDecl}

  ${clsName}({
${ctorParams}
  });

  factory ${clsName}.fromJson(Map<String, dynamic> json) {
    return ${clsName}(
${fromJsonLines}
    );
  }

  Map<String, dynamic> toJson() {
    final data = <String, dynamic>{};
${toJsonLines}
    return data;
  }
}`;
    parts.push(cls);
  }

  return parts.join("\n\n");
}