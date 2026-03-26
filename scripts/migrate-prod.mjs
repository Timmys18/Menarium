import { spawnSync } from "node:child_process";

const isWin = process.platform === "win32";
const npxCmd = isWin ? "npx.cmd" : "npx";

const result = spawnSync(npxCmd, ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error("Ошибка запуска prisma migrate deploy:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
