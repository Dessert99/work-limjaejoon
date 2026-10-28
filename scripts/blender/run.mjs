import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const blender = process.env.BLENDER_BIN || (process.platform === "darwin"
  ? "/Applications/Blender.app/Contents/MacOS/Blender" : "blender");
const source = path.join(root, "assets/blender/workshop.blend");
const mode = process.argv[2];
let args;
if (mode === "setup") {
  args = ["--background", "--python-exit-code", "1", "--python", path.join(root, "scripts/blender/setup.py")];
} else if ((mode === "open" || mode === "export") && existsSync(source)) {
  args = mode === "open" ? [source] : ["--background", source, "--python-exit-code", "1",
    "--python-expr", "import workshop_sync; workshop_sync.export_scene()"];
} else {
  console.error("먼저 pnpm scene:setup을 실행해주세요.");
  process.exit(1);
}
// macOS에서는 이미 열린 앱을 재사용해 MCP 서버가 중복 실행되지 않게 한다.
const reuseApp = mode === "open" && process.platform === "darwin" && !process.env.BLENDER_BIN;
const result = reuseApp
  ? spawnSync("open", ["-a", "Blender", source], { cwd: root, stdio: "inherit" })
  : spawnSync(blender, args, { cwd: root, stdio: "inherit" });
if (result.error) console.error("Blender를 실행할 수 없습니다. 설치하거나 BLENDER_BIN을 지정해주세요.");
process.exit(result.status ?? 1);
