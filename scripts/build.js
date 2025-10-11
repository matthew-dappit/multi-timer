#!/usr/bin/env node

/**
 * Ensures production builds run with Webpack instead of Turbopack.
 * Turbopack currently fails inside certain restricted environments when
 * processing Tailwind/PostCSS, so we strip the enabling env vars before
 * delegating to the real Next.js CLI.
 */

const { spawn } = require("node:child_process");

const nextBin = require.resolve("next/dist/bin/next");

const env = {
  ...process.env,
  TURBOPACK: "",
  IS_TURBOPACK_TEST: "",
  NEXT_TURBO: "",
  NEXT_TURBOPACK: "",
  NEXT_WEBPACK: "1",
};

delete env.__NEXT_TURBOPACK;

const child = spawn(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env,
  cwd: process.cwd(),
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
