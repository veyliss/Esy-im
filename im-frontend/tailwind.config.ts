import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{ts,tsx}"
  ],
  // Tailwind v4 主要通过 CSS @theme 配置主题
  // 这里仅保留必要的配置项
};
export default config;
