# vite-plugin-img2jsx

A vite plugin that converts images into React components.

## Installation

```bash
# npm
npm install --save-dev vite-plugin-img2jsx

# yarn
yarn add -D vite-plugin-img2jsx

# pnpm
pnpm add -D vite-plugin-img2jsx
```

## usage

vite.config.ts

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import img2jsx from "vite-plugin-img2jsx";

export default defineConfig({
  plugins: [react(), img2jsx()]
});
```

App.tsx

```tsx
import Image from "path/to/img.png?jsx";

function App() {
  return <Image />;
}
```

env.d.ts

```ts
/// <reference types="vite-plugin-img2jsx/client" />
```

## options

|   property    |                                                                                    description                                                                                     |                  type                  |                    default                    |
| :-----------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------: | :-------------------------------------------: |
|     test      |                                                                Transform modules that matches this to JSX element.                                                                 |                `RegExp`                | `/\.(png\|jpe?g\|gif\|bmp\|webp\|ico)\?jsx$/` |
|  inlineLimit  |                                                    Use inline base64 data url when assets file size is smaller then this value                                                     |                `number`                |                    `4096`                     |
| assetFilename | Output image assets path and filename, you can use a string same as [build.rollupOptions.output.assetFileNames](https://rollupjs.org/configuration-options/#output-assetfilenames) | `string\|(filename: string) => string` |          `"[name]-[hash][extname]"`           |
| componentName |                                                                                React component name                                                                                |     `(filename: string) => string`     |              `() => "JSXImage"`               |

## License

MIT
