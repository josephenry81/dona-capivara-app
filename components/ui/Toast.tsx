import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    isVisible: boolean;
    onClose: () => void;
}

export default function Toast({ message, type = 'success', isVisible, onClose }: ToastProps) {
    // Use local visible state to handle animation reset if needed
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, message, onClose]); // Added message dependency

    if (!isVisible) return null;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const borderColors = { success: 'border-l-[#00C851]', error: 'border-l-[#ff4444]', info: 'border-l-[#FF4B82]' };

    return (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-5 fade-in duration-300 w-auto max-w-[90%]">
            <div
                className={`bg-white/95 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-l-4 ${borderColors[type]}`}
            >
                <span className="text-lg">{icons[type]}</span>
                <p className="text-gray-800 font-semibold text-sm whitespace-pre-line text-center">{message}</p>
            </div>
        </div>
    );
}
