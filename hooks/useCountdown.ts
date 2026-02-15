import { useState, useEffect, useRef } from 'react';

interface CountdownResult {
    hours: number;
    minutes: number;
    seconds: number;
    isActive: boolean;      // true = timer rodando (produto bloqueado)
    isExpired: boolean;     // true = timer acabou (produto liberado)
    totalSeconds: number;
    formatted: string;      // "12:34:56"
    percentage: number;     // 0-100 (progresso do timer)
}

const EXPIRED_RESULT: CountdownResult = {
    hours: 0, minutes: 0, seconds: 0,
    isActive: false, isExpired: true,
    totalSeconds: 0, formatted: '00:00:00', percentage: 100
};

/**
 * Hook de countdown baseado em data de lançamento.
 * O timer nunca reseta ao recarregar porque é calculado com base na data real.
 * 
 * @param launchDate - Data/hora de lançamento do produto (ISO string ou Date)
 * @param durationHours - Duração total do timer em horas (padrão: 12h)
 */
export function useCountdown(launchDate: string | Date | null | undefined, durationHours: number = 12): CountdownResult {
    const [now, setNow] = useState(() => Date.now());
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Calcula o target time (sempre, sem condicional antes dos hooks)
    const targetTime = launchDate ? new Date(launchDate).getTime() : 0;
    const isValidDate = launchDate ? !isNaN(targetTime) : false;
    const hasLaunchDate = !!launchDate && isValidDate;

    useEffect(() => {
        // Se não tem data válida ou já expirou, não precisa do interval
        if (!hasLaunchDate || targetTime <= Date.now()) return;

        intervalRef.current = setInterval(() => {
            const newNow = Date.now();
            setNow(newNow);

            // Parar o interval quando expirar
            if (newNow >= targetTime) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [targetTime, hasLaunchDate]);

    // Se não tem data de lançamento, produto é normal
    if (!hasLaunchDate) {
        return EXPIRED_RESULT;
    }

    const remainingMs = Math.max(0, targetTime - now);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const isActive = remainingMs > 0;
    const isExpired = !isActive;

    // Porcentagem de progresso (100% = tempo acabou)
    const totalDurationMs = durationHours * 60 * 60 * 1000;
    const elapsed = totalDurationMs - remainingMs;
    const percentage = Math.min(100, Math.max(0, (elapsed / totalDurationMs) * 100));

    const formatted = [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
    ].join(':');

    return {
        hours, minutes, seconds,
        isActive, isExpired,
        totalSeconds, formatted, percentage
    };
}
