import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const distDir = path.resolve(rootDir, "dist");

console.log("Ensure dist exists");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

console.log("1. Copy files");
const filesToCopy = ["README.md", "LICENSE"];
for (const file of filesToCopy) {
  const src = path.resolve(rootDir, file);
  const dest = path.resolve(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to dist/`);
  }
}

console.log("2. Prepare package.json");
const pkgPath = path.resolve(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

console.log("Remove unnecessary fields");
delete pkg.scripts;
delete pkg.devDependencies;
delete pkg.files;

console.log("Function to deeply remove './dist/' from string values");
const stripDist = (obj) => {
  if (typeof obj === "string") {
    return obj.replace(/^\.\/dist\//, "./");
  } else if (Array.isArray(obj)) {
    return obj.map(stripDist);
  } else if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = stripDist(obj[key]);
    }
    return newObj;
  }
  return obj;
};

console.log("Clean up paths in specific fields");
if (pkg.main) pkg.main = stripDist(pkg.main);
if (pkg.module) pkg.module = stripDist(pkg.module);
if (pkg.types) pkg.types = stripDist(pkg.types);
if (pkg.exports) pkg.exports = stripDist(pkg.exports);

const destPkgPath = path.resolve(distDir, "package.json");
fs.writeFileSync(destPkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log("Created clean package.json in dist/");
console.log("Next step: cd dist && npm publish");
