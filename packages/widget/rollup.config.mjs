import { readFileSync } from "fs";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const production = !process.env.ROLLUP_WATCH;
const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

function injectVersion() {
  return {
    name: "inject-version",
    transform(code) {
      if (code.includes("__BUGSPARK_VERSION__")) {
        return code.replace(/__BUGSPARK_VERSION__/g, pkg.version);
      }
      return null;
    },
  };
}

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/bugspark.iife.js",
      format: "iife",
      name: "BugSpark",
      sourcemap: !production,
      exports: "named",
    },
    {
      file: "dist/bugspark.esm.js",
      format: "es",
      sourcemap: !production,
    },
  ],
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json", sourceMap: !production }),
    injectVersion(),
    production && terser(),
  ],
};
