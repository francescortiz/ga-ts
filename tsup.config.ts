import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    tsconfig: "tsconfig.build.json",
    dts: {
        compilerOptions: {
            incremental: false,
        },
    },
    splitting: false,
    sourcemap: true,
    clean: true,
});
