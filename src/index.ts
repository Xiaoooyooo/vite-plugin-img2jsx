import fs from "fs";
import crypto from "crypto";
import { PluginOption } from "vite";

type ImgToJSXOptions = {
  /**
   * Transform modules that matches this to JSX element.
   * @default /\.(png|jpe?g|gif|bmp|webp|ico)\?jsx$/
   */
  test?: RegExp;
  /**
   * Use inline base64 data url when assets file size is smaller then this value
   * @default 4096
   */
  inlineLimit?: number;
  /**
   * Output image assets path and filename,
   * you can use a string same as `build.rollupOptions.output.assetFileNames`
   * @default "[name]-[hash][extname]"
   */
  assetFilename?: string | ((filename: string) => string);
  /**
   * React component name
   * @default "JSXImage"
   */
  componentName?: (filename: string) => string;
};

const DefaultInlineLimit = 4 * 1024;
const DefaultAssetFilename = "[name]-[hash][extname]";
const DefaultImageReg = /\.(png|jpe?g|gif|bmp|webp|ico)\?jsx$/;
function getDefaultComponentName(filename: string) {
  return "JSXImage";
}

const MimeTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

export default function imgToJSX(options: ImgToJSXOptions = {}): PluginOption {
  const {
    test = DefaultImageReg,
    inlineLimit = DefaultInlineLimit,
    assetFilename = DefaultAssetFilename,
    componentName = getDefaultComponentName
  } = options;
  const handledImages = new Set<string>();
  return {
    name: "vite-plugin-img2jsx",
    async transform(code, id, options) {
      if (!test.test(id)) return;
      const { command, root, base } = this.environment.config;
      const isBuildMode = command === "build";
      if (this.cache && this.cache.has(id)) {
        return this.cache.get(id);
      }
      const [filename, searchQuery] = id.split("?");
      const relativeFilename = filename.replace(root + "/", "");
      handledImages.add(relativeFilename);
      let url: string;
      if (!isBuildMode) {
        url = filename.replace(root, "");
        if (base) url = base.replace(/\/$/, "") + url;
      } else {
        const match = filename.match(/.+\/([^/]+)(\.(\w+))$/);
        if (!match) {
          throw new Error("Unexpected image filename");
        }
        const [_, name, extname, ext] = match;
        const stat = await getFileStat(filename);
        if (stat.size > inlineLimit) {
          let templateName: string;
          if (typeof assetFilename === "string") {
            templateName = assetFilename;
          } else {
            templateName = assetFilename(filename);
          }
          const content = await readFileArrayBuffer(filename);
          const hash = hashContent(content);
          url = getAssetFilename(templateName, { name, extname, ext, hash });
          if (isBuildMode) {
            this.emitFile({
              type: "asset",
              fileName: url,
              source: content
            });
          }
          if (base) url = base + url;
        } else {
          url = await readFileBase64(filename, extname);
        }
      }

      const result = wrapJSXComponent(url, componentName(filename));

      if (this.cache) {
        this.cache.set(id, result);
      }

      return result;
    },
    generateBundle(options, bundles, isWrite) {
      for (const [_, bundle] of Object.entries(bundles)) {
        if (bundle.type !== "asset") continue;
        if (bundle.originalFileNames.some((name) => handledImages.has(name))) {
          delete bundles[_];
        }
      }
    }
  };
}

function getAssetFilename(
  template: string,
  replacer: {
    name: string;
    ext: string;
    hash: string;
    extname: string;
  }
) {
  const { name, extname, ext, hash } = replacer;
  return template
    .replace(/\[hash(?::(\d+))?\]/g, (match, $1) =>
      hash.substring(0, parseInt($1 || "8"))
    )
    .replaceAll("[ext]", ext)
    .replaceAll("[name]", name)
    .replaceAll("[extname]", extname);
}

async function getFileStat(filename: string) {
  return new Promise<fs.Stats>((resolve, reject) => {
    fs.stat(filename, (error, stat) => {
      if (error) {
        return reject(error);
      }
      resolve(stat);
    });
  });
}

async function readFileBase64(filename: string, extname: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filename, { encoding: "base64" }, (error, data) => {
      if (error) {
        return reject(error);
      }
      resolve(`data:${MimeTypes[extname]};base64,${data}`);
    });
  });
}

async function readFileArrayBuffer(filename: string) {
  return new Promise<Buffer>((resolve, reject) => {
    fs.readFile(filename, (error, data) => {
      if (error) {
        return reject(error);
      }
      resolve(data);
    });
  });
}

function wrapJSXComponent(url: string, componentName: string) {
  return `import { createElement } from "react";
  export default function ${componentName}(props) {
  return createElement("img", { src: "${url}", ...props })
}`;
}

function hashContent(content: Buffer) {
  const hash = crypto.createHash("SHA256", {});
  hash.update(content);
  return hash.digest("base64");
}
