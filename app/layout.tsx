import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Dona Capivara",
    description: "Os melhores geladinhos gourmet da cidade!",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    themeColor: "#FF4B82",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // App-like feel
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
