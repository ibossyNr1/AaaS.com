import type { Config } from "tailwindcss";
import sharedConfig from "@aaas/ui/tailwind-config";

const config: Config = {
  presets: [sharedConfig as Config],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [],
};
export default config;
