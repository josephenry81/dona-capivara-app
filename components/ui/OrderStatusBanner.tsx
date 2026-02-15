import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderStatusBannerProps {
    orderId: string;
    onViewHistory: () => void;
}

export default function OrderStatusBanner({ orderId, onViewHistory }: OrderStatusBannerProps) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-24 left-6 right-6 z-50 pointer-events-none"
            >
                <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-4 flex items-center justify-between pointer-events-auto overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-full -mr-12 -mt-12 z-0 opacity-50"></div>

                    <div className="flex items-center gap-3 z-10">
                        <div className="bg-pink-100 p-2 rounded-xl animate-pulse">
                            <span className="text-xl">🛵</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Pedido #{orderId.slice(0, 8)}
                            </p>
                            <p className="text-sm font-bold text-gray-800">Aguardando confirmação...</p>
                        </div>
                    </div>

                    <button
                        onClick={onViewHistory}
                        className="bg-[#FF4B82] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md active:scale-95 transition-all z-10"
                    >
                        Ver Detalhes
                    </button>

                    {/* Barra de progresso animada */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D]"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
