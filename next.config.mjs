/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export', // <--- REMOVED (Not needed for Vercel)

    images: {
        // unoptimized: true, // <--- REMOVED (Vercel supports optimization)
        remotePatterns: [
            { protocol: 'https', hostname: 'drive.google.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'scontent.fbfh15-1.fna.fbcdn.net' },
            { protocol: 'https', hostname: 'scontent.fbfh15-2.fna.fbcdn.net' },
            { protocol: 'https', hostname: 'via.placeholder.com' },
            { protocol: 'https', hostname: 'img.freepik.com' },
            { protocol: 'https', hostname: '**' }
        ],
    },
};

export default nextConfig;
