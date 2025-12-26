import { execSync } from "child_process";
import path from "path";

console.log("Building for Vercel...");

// Build frontend with Vite
console.log("Building frontend...");
execSync("npx vite build", { 
  stdio: "inherit",
  cwd: process.cwd()
});

console.log("Vercel build complete!");
