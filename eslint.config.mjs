import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tailwindcss from "eslint-plugin-tailwindcss";
import prettier from "eslint-plugin-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: [
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended",
    ],
  }),
  // A v4 do eslint-plugin-tailwindcss é flat-config nativa e já registra o
  // plugin, então entra direto no array em vez de passar pelo FlatCompat.
  tailwindcss.configs.recommended,
  {
    // No Tailwind v4 a config vive no CSS; sem isso o plugin procura
    // um "src/style.css" que não existe aqui.
    settings: {
      tailwindcss: {
        cssConfigPath: "src/app/globals.css",
      },
    },
  },
  {
    // Em flat config o namespace do plugin é resolvido por bloco: mesmo já
    // registrado acima, precisa constar aqui pras regras serem reconhecidas.
    plugins: {
      tailwindcss,
      prettier,
    },
    rules: {
      "tailwindcss/classnames-order": "off",
      // O plugin não conhece as classes do daisyUI e as reporta como custom.
      "tailwindcss/no-custom-classname": [
        "warn",
        {
          whitelist: [
            "theme-controller",
            "swap-(on|off)",
            "dropdown-content",
            "rating-(hidden|half|xs|sm|md|lg|xl)",
          ],
        },
      ],
      "tailwindcss/no-contradicting-classname": "error",
      "prettier/prettier": "error",
    },
  },
];

export default eslintConfig;
