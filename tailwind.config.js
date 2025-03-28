/** @type {import('tailwindcss').Config} */
export default {
    content: [
        // refrence the library only
        './lib/**/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            gridTemplateColumns: {
                swapcard: '1fr auto',
            },
            colors: {
                primary: {
                    50: 'rgb(var(--mts-primary-50) / <alpha-value>)',
                    100: 'rgb(var(--mts-primary-100) / <alpha-value>)',
                    200: 'rgb(var(--mts-primary-200) / <alpha-value>)',
                    300: 'rgb(var(--mts-primary-300) / <alpha-value>)',
                    400: 'rgb(var(--mts-primary-400) / <alpha-value>)',
                    500: 'rgb(var(--mts-primary-500) / <alpha-value>)',
                    600: 'rgb(var(--mts-primary-600) / <alpha-value>)',
                    700: 'rgb(var(--mts-primary-700) / <alpha-value>)',
                    800: 'rgb(var(--mts-primary-800) / <alpha-value>)',
                    900: 'rgb(var(--mts-primary-900) / <alpha-value>)',
                    950: 'rgb(var(--mts-primary-950) / <alpha-value>)',
                },
                dark: {
                    50: 'rgb(var(--mts-dark-50) / <alpha-value>)',
                    100: 'rgb(var(--mts-dark-100) / <alpha-value>)',
                    200: 'rgb(var(--mts-dark-200) / <alpha-value>)',
                    300: 'rgb(var(--mts-dark-300) / <alpha-value>)',
                    400: 'rgb(var(--mts-dark-400) / <alpha-value>)',
                    500: 'rgb(var(--mts-dark-500) / <alpha-value>)',
                    600: 'rgb(var(--mts-dark-600) / <alpha-value>)',
                    700: 'rgb(var(--mts-dark-700) / <alpha-value>)',
                    800: 'rgb(var(--mts-dark-800) / <alpha-value>)',
                    900: 'rgb(var(--mts-dark-900) / <alpha-value>)',
                    950: 'rgb(var(--mts-dark-950) / <alpha-value>)',
                },
            },
        },
    },
    plugins: [],
    darkMode: 'class',
    prefix: 'mts-',
};
