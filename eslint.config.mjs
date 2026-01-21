import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat({
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Desativa regras que costumam dar conflito no build
      "@next/next/no-html-link-for-pages": "off",
    }
  }
];

export default eslintConfig;