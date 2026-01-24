export interface Product {
    id: string;
    nome: string;
    price: number;
    imagem: string;
    estoque: number;
    categoriaId?: string;
    descricao?: string;
    peso?: string;
    calorias?: string;
    ingredientes?: string;
    tempo?: string;
    // Specific to Mix or other types
    isMix?: boolean;
    ID_Tipo_Produto?: string;
    [key: string]: any;
}

export interface Category {
    id: string;
    nome: string;
}

export interface Banner {
    id: string;
    image: string;
    title: string;
    subtitle?: string;
    ctaText?: string;
}

export interface CatalogData {
    products: Product[];
    categories: Category[];
    banners: Banner[];
}

export interface User {
    id: string;
    name: string;
    phone: string;
    points: number;
    inviteCode?: string;
    favorites: string[];
    isGuest: boolean;
    isAdmin?: boolean;
    adminKey?: string;
    savedAddress?: {
        torre?: string;
        apto?: string;
        fullAddress?: string;
    };
}
