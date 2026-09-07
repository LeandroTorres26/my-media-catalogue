import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolve o alias "@/*" do tsconfig.json (nativo a partir do Vite 8).
    tsconfigPaths: true,
  },
  test: {
    // O store é JavaScript puro: não precisa de DOM para ser testado.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
