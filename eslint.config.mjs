import typescriptEslint from "@typescript-eslint/eslint-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/*.js", "**/node_modules/*", "**/*.t.ts"],
}, ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        ecmaVersion: 2020,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
            createDefaultProgram: true,
        },
    },

    rules: {
        "no-console": "error",
        "no-duplicate-imports": "off",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-misused-promises": "error",

        "@typescript-eslint/no-floating-promises": ["error", {
            ignoreIIFE: true,
        }],

        "require-await": "off",
        "@typescript-eslint/require-await": "error",
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/explicit-function-return-type": "error",
    },
}, {
    files: ["**/*.ts", "**/*.tsx"],
}];