import { defineConfig } from "astro/config";
import UnoCSS from "unocss/astro";
import deno from "@astrojs/deno";

export default defineConfig({
  integrations: [UnoCSS()],
  output: "server",
  adapter: deno(),
});
