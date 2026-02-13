import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "es",
    banner: "#!/usr/bin/env node",
  },
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    json(),
    typescript({ tsconfig: "./tsconfig.json" }),
  ],
  external: [
    "node:fs",
    "node:fs/promises",
    "node:path",
    "node:os",
    "node:process",
    "node:url",
    "node:child_process",
    "node:module",
    "fs",
    "fs/promises",
    "path",
    "os",
    "process",
    "url",
    "child_process",
    "readline",
    "tty",
    "@bugspark/widget",
  ],
};
