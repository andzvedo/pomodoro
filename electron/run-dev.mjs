/**
 * Arranca `next dev`, espera pelo HTTP em :3000 e inicia o Electron.
 * Evita problemas de aspas com concurrently + wait-on + && no npm scripts.
 */
import { spawn } from "node:child_process";
import process from "node:process";
import waitOn from "wait-on";

const next = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

let electronProc = null;

function shutdown(code = 0) {
  try {
    next.kill("SIGTERM");
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

next.on("error", (err) => {
  console.error("[electron:dev] Falha ao iniciar Next.js:", err);
  shutdown(1);
});

next.on("close", (code) => {
  if (electronProc) {
    electronProc.kill("SIGTERM");
  }
  process.exit(code ?? 0);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function main() {
  try {
    await waitOn({
      resources: ["http-get://127.0.0.1:3000"],
      timeout: 120000,
      interval: 250,
    });
  } catch (e) {
    console.error(
      "[electron:dev] Timeout ou erro à espera de http://127.0.0.1:3000:",
      e instanceof Error ? e.message : e,
    );
    shutdown(1);
    return;
  }

  electronProc = spawn("npx", ["electron", "."], {
    stdio: "inherit",
    shell: true,
    env: process.env,
    cwd: process.cwd(),
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
