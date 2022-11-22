import { defineConfig } from 'tsup';

export default defineConfig({
		entry: ['src/index.ts'],
		external: [],
		noExternal: [],
		platform: 'node',
		format: ['esm'],
		target: 'es2022',
		skipNodeModulesBundle: true,
		clean: true,
		shims: true,
		minify: false,
		keepNames: true,
		splitting: false,
		sourcemap: "inline",
		dts: true,
		esbuildPlugins: [],
});