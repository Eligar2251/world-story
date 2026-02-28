import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                surface: {
                    DEFAULT: 'var(--bg-primary)',
                    raised: 'var(--bg-secondary)',
                    overlay: 'var(--bg-tertiary)',
                },
                ink: {
                    DEFAULT: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-tertiary)',
                },
                line: {
                    DEFAULT: 'var(--border)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    hover: 'var(--accent-hover)',
                    soft: 'var(--accent-light)',
                },
            },
            fontFamily: {
                sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
                serif: ['var(--font-lora)', 'Georgia', 'Cambria', 'serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            boxShadow: {
                soft: 'var(--shadow)',
                elevated: 'var(--shadow-lg)',
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
                lg: 'var(--radius-lg)',
            },
            fontSize: {
                '2xs': ['0.6875rem', { lineHeight: '1rem' }],
            },
        },
    },
    plugins: [],
};

export default config;