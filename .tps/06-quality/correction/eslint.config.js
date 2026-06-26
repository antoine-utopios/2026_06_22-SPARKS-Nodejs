import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // `next` reste requis dans la signature a 4 args du middleware d'erreur
      // meme s'il n'est pas utilise -> on l'autorise.
      "no-unused-vars": ["error", { argsIgnorePattern: "^_|^next$" }],
      eqeqeq: "error",
      complexity: ["warn", 10],
      "max-depth": ["warn", 4],
    },
  },
];
