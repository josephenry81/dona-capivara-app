'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface ModalOptions {
    title: string;
    message: string;
    type?: ModalType;
    icon?: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface ModalState extends ModalOptions {
    isOpen: boolean;
    resolve?: (value: boolean) => void;
}

export const useModal = () => {
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const hideModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        if (modalState.resolve) {
            modalState.resolve(false);
        }
    }, [modalState]);

    const showModal = useCallback((options: ModalOptions) => {
        return new Promise<boolean>(resolve => {
            setModalState({
                ...options,
                isOpen: true,
                resolve
            });
        });
    }, []);

    const alert = useCallback(
        (title: string, message: string, type: ModalType = 'info') => {
            showModal({
                title,
                message,
                type,
                showCancel: false,
                confirmText: 'Entendido'
            });
        },
        [showModal]
    );

    const confirm = useCallback(
        (title: string, message: string) => {
            return showModal({
                title,
                message,
                type: 'confirm',
                showCancel: true,
                confirmText: 'Confirmar',
                cancelText: 'Cancelar'
            });
        },
        [showModal]
    );

    const ModalComponent = () => {
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            setMounted(true);
            return () => setMounted(false);
        }, []);

        if (!modalState.isOpen || !mounted) return null;

        const getIcon = () => {
            // ... (same implementation)
            if (modalState.icon) return modalState.icon;
            switch (modalState.type) {
                case 'success':
                    return '✅';
                case 'warning':
                    return '⚠️';
                case 'error':
                    return '❌';
                case 'confirm':
                    return '❓';
                default:
                    return 'ℹ️';
            }
        };

        const getTypeStyles = () => {
            // ... (same implementation)
            switch (modalState.type) {
                case 'success':
                    return 'from-green-400 to-emerald-600';
                case 'warning':
                    return 'from-orange-400 to-amber-600';
                case 'error':
                    return 'from-red-400 to-rose-600';
                case 'confirm':
                    return 'from-blue-400 to-indigo-600';
                default:
                    return 'from-pink-400 to-orange-500';
            }
        };

        const handleConfirm = () => {
            if (modalState.onConfirm) modalState.onConfirm();
            if (modalState.resolve) modalState.resolve(true);
            setModalState(prev => ({ ...prev, isOpen: false }));
        };

        const handleCancel = () => {
            if (modalState.onCancel) modalState.onCancel();
            if (modalState.resolve) modalState.resolve(false);
            setModalState(prev => ({ ...prev, isOpen: false }));
        };

        return createPortal(
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div
                    className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl w-full max-w-sm transform animate-in zoom-in-95 duration-300 ease-out border border-white/20"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header/Banner */}
                    <div className={`h-24 bg-gradient-to-br ${getTypeStyles()} flex items-center justify-center`}>
                        <span className="text-5xl drop-shadow-lg transform scale-110 active:scale-125 transition-transform duration-500">
                            {getIcon()}
                        </span>
                    </div>

                    <div className="p-6 text-center">
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-2 leading-tight">
                            {modalState.title}
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                            {modalState.message}
                        </p>

                        <div className="flex gap-3 mt-4">
                            {modalState.showCancel && (
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-95 duration-100"
                                >
                                    {modalState.cancelText || 'Cancelar'}
                                </button>
                            )}
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r ${getTypeStyles()} text-white font-bold text-sm shadow-lg hover:brightness-110 transition-all active:scale-95 duration-100`}
                            >
                                {modalState.confirmText || 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Backdrop overlay trigger for closing */}
                <div className="fixed inset-0 -z-10" onClick={handleCancel} />
            </div>,
            document.body
        );
    };

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (modalState.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [modalState.isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') hideModal();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [hideModal]);

    return {
        modalState,
        showModal,
        hideModal,
        alert,
        confirm,
        Modal: ModalComponent
    };
};
