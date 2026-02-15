import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_URL = 'https://app.donacapivara.com.br';
const WHATSAPP_PHONE = '+55-41-99148-0096';

export const metadata: Metadata = {
    title: 'Dona Capivara | Geladinhos Gourmet',
    description:
        'Os melhores geladinhos gourmet de Curitiba. Sabores artesanais, frescos e deliciosos. Peça pelo WhatsApp!',
    manifest: '/manifest.json',

    // SEO Keywords
    keywords: [
        'geladinho gourmet',
        'picolé artesanal',
        'geladinho curitiba',
        'dona capivara',
        'sobremesa gelada',
        'delivery geladinho'
    ],

    // Robots
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true
        }
    },

    // Open Graph (WhatsApp, Facebook, LinkedIn)
    openGraph: {
        type: 'website',
        locale: 'pt_BR',
        url: SITE_URL,
        siteName: 'Dona Capivara',
        title: 'Dona Capivara | Geladinhos Gourmet',
        description: 'Os melhores geladinhos gourmet de Curitiba. Sabores artesanais e frescos!',
        images: [
            {
                url: `${SITE_URL}/og-image.jpg`,
                width: 1200,
                height: 630,
                alt: 'Dona Capivara - Geladinhos Gourmet'
            }
        ]
    },

    // Twitter Cards
    twitter: {
        card: 'summary_large_image',
        title: 'Dona Capivara | Geladinhos Gourmet',
        description: 'Os melhores geladinhos gourmet de Curitiba!',
        images: [`${SITE_URL}/og-image.jpg`]
    },

    icons: {
        icon: '/favicon.ico',
        apple: [
            { url: '/icons/apple-icon-57x57.png', sizes: '57x57' },
            { url: '/icons/apple-icon-60x60.png', sizes: '60x60' },
            { url: '/icons/apple-icon-72x72.png', sizes: '72x72' },
            { url: '/icons/apple-icon-76x76.png', sizes: '76x76' },
            { url: '/icons/apple-icon-114x114.png', sizes: '114x114' },
            { url: '/icons/apple-icon-120x120.png', sizes: '120x120' },
            { url: '/icons/apple-icon-144x144.png', sizes: '144x144' },
            { url: '/icons/apple-icon-152x152.png', sizes: '152x152' },
            { url: '/icons/apple-icon-180x180.png', sizes: '180x180' }
        ]
    }
};

export const viewport: Viewport = {
    themeColor: '#FF4B82',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
};

// Schema.org LocalBusiness (JSON-LD)
const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Dona Capivara',
    description: 'Geladinhos gourmet artesanais em Curitiba',
    url: SITE_URL,
    telephone: WHATSAPP_PHONE,
    image: `${SITE_URL}/og-image.jpg`,
    address: {
        '@type': 'PostalAddress',
        addressLocality: 'Curitiba',
        addressRegion: 'PR',
        addressCountry: 'BR'
    },
    priceRange: '$$',
    servesCuisine: 'Sobremesas',
    openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '18:00'
    }
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <head>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            </head>
            <body>{children}</body>
        </html>
    );
}
