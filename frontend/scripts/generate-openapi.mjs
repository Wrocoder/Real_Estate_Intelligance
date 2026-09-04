import { mkdir, writeFile } from "node:fs/promises";
import openapiTS from "openapi-typescript";
import ts from "typescript";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const schemaResponse = await fetch(`${apiBaseUrl}/openapi.json`);
if (!schemaResponse.ok) {
  throw new Error(`OpenAPI schema request failed: ${schemaResponse.status}`);
}

const schema = await schemaResponse.json();
const nodes = await openapiTS(schema);
const sourceFile = ts.createSourceFile("generated-api.ts", "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const output = nodes
  .map((node) => printer.printNode(ts.EmitHint.Unspecified, node, sourceFile))
  .join("\n\n");
await mkdir("lib", { recursive: true });
await writeFile(
  "lib/generated-api.ts",
  `/**\n * This file is auto-generated from FastAPI's /openapi.json.\n * Do not make direct changes; run npm run generate:openapi.\n */\n\n${output}\n`,
  "utf8",
);
console.log(`Generated lib/generated-api.ts from ${apiBaseUrl}/openapi.json`);
