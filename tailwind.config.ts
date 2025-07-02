import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'addy-blue': '#0275DE',
        'addy-blue-light': '#F2F9FF',
      },
      fontFamily: {
        'sf-pro': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Icons', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;