import {
  defineConfig,
  presetTypography,
  presetUno,
  presetWebFonts,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetTypography(),
    presetWebFonts({
      provider: "google",
      fonts: {
        title: "Staatliches",
        os: "Open Sans",
      },
    }),
  ],
  theme: {
    colors: {
      navy: "#004a8f",
      vegas: "#fec10d",
    },
  },
});
