import { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    rootDir: ".",
    coverageDirectory: "<rootDir>/coverage/",
    collectCoverageFrom: ["src/**/*.ts"],
    coveragePathIgnorePatterns: [
        "<rootDir>/build/",
        "<rootDir>/dist/",
        "<rootDir>/snapshotResolver.js",
    ],
    testPathIgnorePatterns: [".*/node_modules/", "\\.snap$"],
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/tsconfig.json",
                isolatedModules: true, // Speeds up tests, but can have issues.
            },
        ],
    },
    testMatch: ["**/*.steps.ts", "**/*.spec.ts"],
    moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node", ".d.ts"],
    moduleDirectories: ["node_modules"],
};

export default jestConfig;
