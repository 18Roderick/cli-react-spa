import type { BuildConfig } from "bun";

export default {
    entrypoints: ["./src/**/*.ts"],  // All TS files in src
    outdir: "./build",
    target: "node",
    format: "cjs",
    minify: process.env.NODE_ENV === "production"
  } satisfies BuildConfig;