import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Dona Capivara",
    description: "Os melhores geladinhos gourmet da cidade!",
    manifest: "/manifest.json",
    icons: {
        icon: "/favicon.ico",
        apple: [
            { url: "/icons/apple-icon-57x57.png", sizes: "57x57" },
            { url: "/icons/apple-icon-60x60.png", sizes: "60x60" },
            { url: "/icons/apple-icon-72x72.png", sizes: "72x72" },
            { url: "/icons/apple-icon-76x76.png", sizes: "76x76" },
            { url: "/icons/apple-icon-114x114.png", sizes: "114x114" },
            { url: "/icons/apple-icon-120x120.png", sizes: "120x120" },
            { url: "/icons/apple-icon-144x144.png", sizes: "144x144" },
            { url: "/icons/apple-icon-152x152.png", sizes: "152x152" },
            { url: "/icons/apple-icon-180x180.png", sizes: "180x180" },
        ],
    },
};

export const viewport: Viewport = {
    themeColor: "#FF4B82",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}
