/**
 * Electron + Next de forma estável: por defeito usa `next build` + `next start`.
 * O modo `next dev` (Turbopack ou Webpack) usa WebSockets de HMR que falham
 * frequentemente no Chromium do Electron (ERR_INVALID_HTTP_RESPONSE).
 *
 * Variáveis opcionais:
 * - ELECTRON_USE_NEXT_DEV=1 — volta ao fluxo antigo com `npm run dev:webpack`.
 * - ELECTRON_SKIP_BUILD=1 — não corre `next build` (exige .next/BUILD_ID válido).
 * - ELECTRON_FORCE_BUILD=1 — corre `next build` mesmo com BUILD_ID existente.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import waitOn from "wait-on";

const cwd = process.cwd();
const buildIdPath = path.join(cwd, ".next", "BUILD_ID");

/** @type {import('node:child_process').ChildProcess | null} */
let serverProc = null;
/** @type {import('node:child_process').ChildProcess | null} */
let electronProc = null;

function shutdown(code = 0) {
  try {
    serverProc?.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  try {
    electronProc?.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function runBuild() {
  return new Promise((resolve, reject) => {
    const p = spawn("npm", ["run", "build"], {
      stdio: "inherit",
      shell: true,
      cwd,
      env: process.env,
    });
    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`next build saiu com código ${code}`));
    });
    p.on("error", reject);
  });
}

function startProductionServer() {
  return spawn("npx", ["next", "start", "-p", "3000"], {
    stdio: "inherit",
    shell: true,
    cwd,
    env: { ...process.env, PORT: "3000", NODE_ENV: "production" },
  });
}

function startWebpackDev() {
  return spawn("npm", ["run", "dev:webpack"], {
    stdio: "inherit",
    shell: true,
    cwd,
    env: process.env,
  });
}

async function main() {
  const useNextDev = process.env.ELECTRON_USE_NEXT_DEV === "1";

  if (useNextDev) {
    console.log(
      "[electron:dev] ELECTRON_USE_NEXT_DEV=1 → next dev --webpack (HMR pode falhar no Electron).",
    );
    serverProc = startWebpackDev();
  } else {
    const skipBuild = process.env.ELECTRON_SKIP_BUILD === "1";
    const forceBuild = process.env.ELECTRON_FORCE_BUILD === "1";
    const hasBuild = existsSync(buildIdPath);

    if (skipBuild && !hasBuild) {
      console.error(
        "[electron:dev] Falta .next/BUILD_ID. Corre `npm run build` ou repete sem ELECTRON_SKIP_BUILD=1.",
      );
      process.exit(1);
    }

    if (!skipBuild && (!hasBuild || forceBuild)) {
      if (forceBuild && hasBuild) {
        console.log("[electron:dev] Rebuild forçado (ELECTRON_FORCE_BUILD=1)…");
      } else if (!hasBuild) {
        console.log("[electron:dev] A executar next build…");
      }
      try {
        await runBuild();
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    } else if (skipBuild) {
      console.log("[electron:dev] ELECTRON_SKIP_BUILD=1 — sem build.");
    } else if (hasBuild) {
      console.log(
        "[electron:dev] Build em cache. Se mudaste código: `npm run build` ou `ELECTRON_FORCE_BUILD=1 npm run electron:dev`.",
      );
    }

    console.log("[electron:dev] A iniciar next start (produção local, porta 3000)…");
    serverProc = startProductionServer();
  }

  serverProc.on("error", (err) => {
    console.error("[electron:dev] Falha ao iniciar servidor Next:", err);
    shutdown(1);
  });

  serverProc.on("close", (code) => {
    if (electronProc) {
      electronProc.kill("SIGTERM");
    }
    if (code !== 0 && code !== null) {
      process.exit(code);
    }
  });

  const timeout = useNextDev ? 120000 : 90000;
  try {
    await waitOn({
      resources: ["http-get://127.0.0.1:3000"],
      timeout,
      interval: 500,
    });
  } catch (e) {
    console.error(
      "[electron:dev] Timeout a esperar http://127.0.0.1:3000:",
      e instanceof Error ? e.message : e,
    );
    shutdown(1);
    return;
  }

  electronProc = spawn("npx", ["electron", "."], {
    stdio: "inherit",
    shell: true,
    env: process.env,
    cwd,
  });

  electronProc.on("close", (code) => {
    shutdown(code ?? 0);
  });

  electronProc.on("error", (err) => {
    console.error("[electron:dev] Falha ao iniciar Electron:", err);
    shutdown(1);
  });
}

main();
