import type { Config } from "tailwindcss";
import sharedConfig from "@aaas/ui/tailwind-config";

const config: Config = {
  presets: [sharedConfig as Config],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [],
};

export default config;
