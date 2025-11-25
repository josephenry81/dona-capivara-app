import React from 'react';

export default function FloatingWhatsApp() {
    // Replace with the store's real number (Dona Capivara)
    const PHONE = '5541991480096';
    const MESSAGE = 'Olá Dona Capivara! Gostaria de tirar uma dúvida sobre o cardápio.';

    const link = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-20 right-4 z-40 bg-[#25D366] p-3 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center animate-in fade-in slide-in-from-bottom-4"
            aria-label="Falar no WhatsApp"
        >
            <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                alt="WhatsApp"
                className="w-8 h-8"
            />
        </a>
    );
}
