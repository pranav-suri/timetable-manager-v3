import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import devtoolsJson from "vite-plugin-devtools-json";

const config = defineConfig({
  plugins: [
    devtoolsJson(), // https://github.com/TanStack/router/issues/2459
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      customViteReactPlugin: true,
      spa: {
        enabled: true, // This turns off SSR
      },
    }),
    viteReact({
      babel: {
        plugins: [["babel-plugin-react-compiler", {}]],
      },
    }),
  ],
});

export default config;
