import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          alt: 'var(--surface-alt)',
        },
        text: {
          DEFAULT: 'var(--text)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
        },
        success: {
          DEFAULT: 'var(--success)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
