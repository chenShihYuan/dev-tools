// 📄 路徑：src/tools/generators/swift.ts
import { buildSchemas, FieldInfo } from "./unified-helper";

function mapSwiftType(f: FieldInfo) {
  if (f.type === "string") return "String?";
  if (f.type === "number") return "Double?";
  if (f.type === "boolean") return "Bool?";
  if (f.type === "array") {
    if (typeof f.raw === "string" && f.raw !== "string" && f.raw !== "number" && f.raw !== "boolean") {
      return `[${f.raw}]?`;
    }
    if (f.raw === "string") return "[String]?";
    if (f.raw === "number") return "[Double]?";
    if (f.raw === "boolean") return "[Bool]?";
    return "[Any]?";
  }
  if (f.type === "object") return `${f.raw}?`;
  return "Any?";
}

export function generateSwiftModel(rootName: string, json: any) {
  const schemas = buildSchemas(rootName, json);
  const parts: string[] = [];

  for (const clsName of Object.keys(schemas)) {
    const s = schemas[clsName];
    const props = s.fields.map(f => `    var ${f.prop}: ${mapSwiftType(f)}`).join("\n");

    // produce simple init from dict and toDict
    const initLines = s.fields.map(f => {
      if (f.type === "object") {
        return `        ${f.prop} = dict["${f.name}"] != nil ? ${f.raw}(from: dict["${f.name}"] as! [String:Any]) : nil`;
      } else if (f.type === "array" && typeof f.raw === "string" && f.raw !== "string" && f.raw !== "number" && f.raw !== "boolean") {
        return `        ${f.prop} = (dict["${f.name}"] as? [[String:Any]])?.map { ${f.raw}(from: $0) }`;
      } else {
        return `        ${f.prop} = dict["${f.name}"] as? ${mapSwiftType(f).replace("?", "")}`;
      }
    }).join("\n");

    const toDictLines = s.fields.map(f => {
      if (f.type === "object") {
        return `        if let v = ${f.prop} { dict["${f.name}"] = v.toDict() }`;
      } else if (f.type === "array" && typeof f.raw === "string" && f.raw !== "string" && f.raw !== "number" && f.raw !== "boolean") {
        return `        if let arr = ${f.prop} { dict["${f.name}"] = arr.map { $0.toDict() } }`;
      } else {
        return `        dict["${f.name}"] = ${f.prop}`;
      }
    }).join("\n");

    const cls = `struct ${clsName} {
${props}

    init(from dict: [String:Any]) {
${initLines}
    }

    func toDict() -> [String:Any] {
        var dict: [String:Any] = [:]
${toDictLines}
        return dict
    }
}`;
    parts.push(cls);
  }

  return parts.join("\n\n");
}