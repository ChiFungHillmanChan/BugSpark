import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/bugspark.iife.js",
      format: "iife",
      name: "BugSpark",
      sourcemap: true,
      exports: "named",
    },
    {
      file: "dist/bugspark.esm.js",
      format: "es",
      sourcemap: true,
    },
  ],
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json", sourceMap: true }),
    production && terser(),
  ],
};
