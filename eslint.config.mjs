import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  // Isso emula o comportamento da versão anterior para evitar erros de serialização
  baseDirectory: process.cwd(),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Desativa regras que costumam dar falso-positivo no build da Vercel
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "off"
    }
  }
];

export default eslintConfig;