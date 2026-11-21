import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    // New React Compiler-era rules (react-hooks v6, shipped with Next 16) flag
    // existing patterns. Kept visible as warnings; fix gradually.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "warn",
    },
  },
  globalIgnores([".next/**", ".open-next/**", ".wrangler/**", "cli/**", "node_modules/**", "out/**", "next-env.d.ts"]),
]);
