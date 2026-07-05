import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist/",
      "node_modules/",
      "website/",
      ".astro/",
      "bot/src/examples/",
      "tests/",
    ],
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: [
      "bot/**/*.ts",
      "shared/**/*.ts",
      "web-admin/**/*.ts",
      "scripts/**/*.ts",
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
);
