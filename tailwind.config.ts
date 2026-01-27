import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        extend: {
            colors: {
                primary: '#FF4B82',
                secondary: '#FF9E3D',
                // Aliases para compatibilidade com componentes existentes
                lavender: '#FF4B82',
                'azure-mist': '#FF9E3D',
                silver: '#FF9E3D',
                'soft-linen': '#F5F6FA',
                'lavender-veil': '#FFB6C1'
            }
        }
    },
    plugins: []
};

export default config;
