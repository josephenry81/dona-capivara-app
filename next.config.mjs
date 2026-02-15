import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true, // Disable image optimization to avoid memory issues with Google Drive images
        remotePatterns: [
            { protocol: 'https', hostname: 'drive.google.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'scontent.fbfh15-1.fna.fbcdn.net' },
            { protocol: 'https', hostname: 'scontent.fbfh15-2.fna.fbcdn.net' },
            { protocol: 'https', hostname: 'via.placeholder.com' },
            { protocol: 'https', hostname: 'img.freepik.com' },
            { protocol: 'https', hostname: '**' }
        ]
    },

    // 🚀 OTIMIZAÇÃO: Remove console.logs em produção (mantém error e warn)
    compiler: {
        removeConsole:
            process.env.NODE_ENV === 'production'
                ? {
                      exclude: ['error', 'warn']
                  }
                : false
    },

    // 🚀 OTIMIZAÇÃO: Compressão automática
    compress: true,

    // 🚀 OTIMIZAÇÃO: Headers de cache agressivo para assets estáticos
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|webp|gif|ico)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable'
                    }
                ]
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable'
                    }
                ]
            }
        ];
    }
};

export default withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development' // Disable PWA in dev mode to avoid caching issues
})(nextConfig);
