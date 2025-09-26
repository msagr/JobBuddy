#!/usr/bin/env node

import { execSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Load the root package.json (adjust path if script is nested deeper)
const pkg = require("../package.json");

// Figure out shadcn version
const shadcnVersion =
  pkg.dependencies?.["shadcn"] ||
  pkg.dependencies?.["shadcn/ui"] || // common case
  pkg.devDependencies?.["shadcn"] ||
  pkg.devDependencies?.["shadcn/ui"] ||
  "latest";

const args = process.argv.slice(2).join(" ");

// Run the command
execSync(`npx shadcn@${shadcnVersion} add ${args}`, { stdio: "inherit" });
