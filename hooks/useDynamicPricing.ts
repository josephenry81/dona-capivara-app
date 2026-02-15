import { useState, useEffect } from 'react';
import { isUserLocal } from '../utils/geo';

export const useDynamicPricing = () => {
    // isLocal: null (carregando/indefinido), true (vizinho), false (externo)
    const [isLocal, setIsLocal] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [permissionDenied, setPermissionDenied] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            setLoading(false);
            return;
        }

        // Tenta obter localização com alta precisão
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const local = isUserLocal(latitude, longitude);
                // Salva no localStorage para persistência na sessão
                localStorage.setItem('userIsLocal', local.toString());
                setIsLocal(local);
                setLoading(false);
            },
            (error) => {
                console.warn('⚠️ Erro ao obter localização:', error.message);
                setPermissionDenied(true);

                // Tenta recuperar do cache se falhar
                const cached = localStorage.getItem('userIsLocal');
                if (cached !== null) {
                    setIsLocal(cached === 'true');
                } else {
                    setIsLocal(false); // Default: Preço padrão (Externo)
                }
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }, []);

    // Função utilitária para calcular preço removida pois não estava sendo usada
    // Lógica movida para os componentes consumidores


    return { isLocal, loading, permissionDenied };
};
