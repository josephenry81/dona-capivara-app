import React, { useState, useEffect } from 'react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwaPromptDismissed', 'true');
    };

    if (!showPrompt || localStorage.getItem('pwaPromptDismissed')) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-lg p-4 z-50 border-2 border-[#FF4B82]">
            <div className="flex items-start gap-3">
                <div className="text-3xl">📱</div>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">Instalar App</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Adicione Dona Capivara à sua tela inicial para acesso rápido!
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleInstall}
                            className="flex-1 bg-[#FF4B82] text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-[#FF3A72] transition"
                        >
                            Instalar
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition"
                        >
                            Agora não
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
