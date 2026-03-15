import { defineConfig } from "oxlint";

export default defineConfig({
  $schema: "./node_modules/oxlint/configuration_schema.json",
  ignorePatterns: ["dist"],
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      plugins: ["typescript", "react"],
      env: {
        es2020: true,
        browser: true,
      },
    },
  ],
});
