export const STORE_COORDINATES = {
    lat: -25.51488,
    lng: -49.28827,
    radiusKm: 0.16938 // 169.38 metros
};

/**
 * Calcula a distância em km entre duas coordenadas usando a fórmula de Haversine
 */
export const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const degreesToRadians = (deg: number): number => {
    return deg * (Math.PI / 180);
};

export const isUserLocal = (userLat: number, userLon: number): boolean => {
    const distance = calculateDistanceKm(userLat, userLon, STORE_COORDINATES.lat, STORE_COORDINATES.lng);
    return distance <= STORE_COORDINATES.radiusKm;
};
