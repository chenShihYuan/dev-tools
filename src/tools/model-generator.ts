// 📄 路徑：src/tools/model-generator.ts
import { generateDartModel } from "./generators/dart";
import { generateSwiftModel } from "./generators/swift";
import { generateTsModel } from "./generators/ts";
import { generateKotlinModel } from "./generators/kotlin";
import { generateJavaModel } from "./generators/java";
import { generateCSharpModel } from "./generators/csharp";
import { generateGoModel } from "./generators/go";
import { generatePythonModel } from "./generators/python";
import { generateRustModel } from "./generators/rust";
import { generatePHPModel } from "./generators/php";

export interface GenOptions {
  className: string;
  lang: string;
}

export function generateModel(json: any, opt: GenOptions): string {
  const map: Record<string, Function> = {
    dart: generateDartModel,
    swift: generateSwiftModel,
    ts: generateTsModel,
    kotlin: generateKotlinModel,
    java: generateJavaModel,
    csharp: generateCSharpModel,
    go: generateGoModel,
    python: generatePythonModel,
    rust: generateRustModel,
    php: generatePHPModel,
  };

  const fn = map[opt.lang];
  if (!fn) return "// ❌ Unsupported language";

  var className = "RootModel";
  if (opt.className) {
    className = opt.className;
  }

  return fn(className, json);
}