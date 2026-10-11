import { Config } from "@remotion/cli/config";

// Container has no access to remotion.media: use the preinstalled headless shell.
Config.setBrowserExecutable(
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
);
