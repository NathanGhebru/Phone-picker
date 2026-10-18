import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "../../");

// Register alias resolver for @/ -> src/
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const subpath = request.slice(2);
    const resolved = path.join(srcDir, subpath);
    return originalResolve.call(this, resolved, parent, isMain, options);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

// Register in-memory TypeScript and TSX transpiler
const compileTs = function (module, filename) {
  const content = fs.readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: filename,
  });
  module._compile(transpiled.outputText, filename);
};

require.extensions[".ts"] = compileTs;
require.extensions[".tsx"] = compileTs;

const testFiles = [
  "./i18n.test.ts",
  "./components.test.ts",
];

console.log("==================================================");
console.log(" Running VoiceMatch Frontend & i18n Test Suites");
console.log("==================================================\n");

let failed = false;
for (const file of testFiles) {
  const resolvedPath = path.resolve(__dirname, file);
  console.log(`[SUITE] Executing ${file}...`);
  try {
    require(resolvedPath);
  } catch (err) {
    console.error(`FAILED: ${file}`);
    console.error(err);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
