/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Generates static HTML/CSS/JS
    images: {
        unoptimized: true, // GitHub Pages cannot optimize images on the fly
        remotePatterns: [
            { protocol: 'https', hostname: '**' } // Allow external images
        ],
    },
};

export default nextConfig;
