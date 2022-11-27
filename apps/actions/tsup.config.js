import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  external: [],
  noExternal: [],
  platform: "node",
  format: ["esm"],
  target: "es2022",
  skipNodeModulesBundle: true,
  clean: true,
  shims: true,
  minify: false,
  keepNames: true,
  sourcemap: "inline",
  splitting: false,
  dts: true, // FIXME: DTS Build Errors with: RollupError: Invalid substitution "./src/config" for placeholder "[name]" in "output.entryFileNames" pattern, can be neither absolute nor relative path.
  esbuildPlugins: [],
});
