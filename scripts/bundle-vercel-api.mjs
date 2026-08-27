import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = join(root, "api/.bundle/handler.mjs");

await mkdir(dirname(outfile), { recursive: true });

await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["apps/api/src/vercel.ts"],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "bundle",
  logLevel: "info",
  banner: {
    js: [
      'import { createRequire as __fantapickerCreateRequire } from "node:module";',
      "const require = __fantapickerCreateRequire(import.meta.url);",
    ].join(""),
  },
});

await writeFile(
  join(dirname(outfile), "package.json"),
  `${JSON.stringify({ type: "module" }, null, 2)}\n`,
);

console.log(`Bundled Vercel API → ${outfile}`);
