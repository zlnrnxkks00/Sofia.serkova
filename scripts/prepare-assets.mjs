import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { root, source, read, parse, resources } from "./project.mjs";

export async function prepareAssets() {
  const directory = path.join(root, ".vite-public");
  await fs.rm(directory, { recursive: true, force: true });
  const files = await resources(parse(await read("index.html")));
  async function addLicenses(folder) {
    for (const entry of await fs.readdir(path.join(source, folder), {
      withFileTypes: true,
    })) {
      const file = path.posix.join(folder, entry.name);
      if (entry.isDirectory()) await addLicenses(file);
      else if (/LICENSE|OFL/i.test(entry.name)) files.add(file);
    }
  }
  await addLicenses("assets");
  for (const file of files) {
    if (!file.startsWith("assets/") || file === "assets/lucide.min.js")
      continue;
    const destination = path.join(directory, file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(source, file), destination);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await prepareAssets();
