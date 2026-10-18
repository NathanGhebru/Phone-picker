const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Register in-memory TypeScript transpiler for .ts test files
require.extensions[".ts"] = function (module, filename) {
  const content = fs.readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: filename,
  });
  module._compile(transpiled.outputText, filename);
};

const testFiles = [
  "./preference-state.test.ts",
  "./preference-extractor.test.ts",
  "./conversation-policy.test.ts",
  "./explanations.test.ts",
  "./recommendation-client.test.ts",
  "./acceptance.test.ts",
];

console.log("========================================");
console.log(" Running VoiceMatch Agent Test Suites");
console.log("========================================\n");

for (const file of testFiles) {
  const resolvedPath = path.resolve(__dirname, file);
  console.log(`[SUITE] Loading ${file}...`);
  require(resolvedPath);
}
