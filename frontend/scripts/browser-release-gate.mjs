import { spawn } from "node:child_process";

const checks = [
  {
    name: "privacy-safe buyer outcome prompt",
    args: ["run", "browser:check-entry:outcome"],
  },
  {
    name: "aggregate admin buyer funnel",
    args: ["run", "browser:admin-funnel"],
  },
];

function runCheck(check) {
  return new Promise((resolve, reject) => {
    console.log(`\n[release gate] ${check.name}`);
    const command = process.platform === "win32" ? "cmd.exe" : "npm";
    const args = process.platform === "win32"
      ? ["/d", "/s", "/c", ["npm", ...check.args].join(" ")]
      : check.args;
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${check.name} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

for (const check of checks) {
  await runCheck(check);
}

console.log("\nBrowser release gate passed.");
