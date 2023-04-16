import { defineConfig } from "astro/config";
import UnoCSS from "unocss/astro";
import deno from "@astrojs/deno";

// https://astro.build/config
export default defineConfig({
  integrations: [
    UnoCSS({
      injectReset: true,
    }),
  ],
  output: "server",
  adapter: deno(),
});
