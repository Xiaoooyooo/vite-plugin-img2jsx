import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import img2jsx from "vite-plugin-img2jsx";

export default defineConfig({
  plugins: [
    react(),
    img2jsx({
      inlineLimit: 10 * 1024,
      assetFilename: "assets/img/[name]-[hash][extname]",
      componentName(filename) {
        return filename.match(/.+\/([^/]+)\.\w+/)![1];
      }
    })
  ]
});
