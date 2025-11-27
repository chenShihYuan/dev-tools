// 📄 路徑：src/tools/generators/ts.ts
import { buildSchemas, FieldInfo } from "./unified-helper";

function mapTsType(f: FieldInfo) {
  if (f.type === "string") return "string | null";
  if (f.type === "number") return "number | null";
  if (f.type === "boolean") return "boolean | null";
  if (f.type === "array") {
    if (typeof f.raw === "string" && f.raw !== "string" && f.raw !== "number" && f.raw !== "boolean") {
      return `${f.raw}[] | null`;
    }
    if (f.raw === "string") return "string[] | null";
    if (f.raw === "number") return "number[] | null";
    if (f.raw === "boolean") return "boolean[] | null";
    return "any[] | null";
  }
  if (f.type === "object") return `${f.raw} | null`;
  return "any | null";
}

export function generateTsModel(rootName: string, json: any) {
  const schemas = buildSchemas(rootName, json);
  const parts: string[] = [];

  for (const clsName of Object.keys(schemas)) {
    const s = schemas[clsName];
    const lines = s.fields.map(f => `  ${f.prop}?: ${mapTsType(f)};`);
    // simple fromJSON / toJSON helpers
    const fromLines = s.fields.map(f => {
      if (f.type === "object") {
        return `    ${f.prop}: json['${f.name}'] ? ${f.raw}.fromJson(json['${f.name}']) : null,`;
      } else if (f.type === "array" && typeof f.raw === "string" && f.raw !== "string" && f.raw !== "number" && f.raw !== "boolean") {
        return `    ${f.prop}: json['${f.name}'] ? json['${f.name}'].map((e:any)=> ${f.raw}.fromJson(e)) : null,`;
      } else {
        return `    ${f.prop}: json['${f.name}'],`;
      }
    }).join("\n");

    const toLines = s.fields.map(f => {
      if (f.type === "object") return `    if (this.${f.prop}) out['${f.name}'] = this.${f.prop}!.toJson();`;
      if (f.type === "array" && typeof f.raw === "string" && f.raw !== "string" && f.raw !== "number" && f.raw !== "boolean") return `    if (this.${f.prop}) out['${f.name}'] = this.${f.prop}!.map(e=>e.toJson());`;
      return `    out['${f.name}'] = this.${f.prop};`;
    }).join("\n");

    const cls = `export class ${clsName} {
${lines.join("\n")}

  static fromJson(json: any): ${clsName} {
    return new ${clsName}(
${fromLines}
    );
  }

  toJson(): any {
    const out: any = {};
${toLines}
    return out;
  }

  constructor(init?: any) {
    if (init) {
${s.fields.map(f => `      this.${f.prop} = init['${f.name}'];`).join("\n")}
    }
  }
}`;
    parts.push(cls);
  }

  return parts.join("\n\n");
}