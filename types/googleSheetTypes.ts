export interface Geladinho {
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
    [key: string]: any;
}

export interface Configuracoes {
    [key: string]: any;
}

export interface Cliente {
    ID_Cliente?: string;
    Nome?: string;
    Telefone?: string;
    [key: string]: any;
}

export interface CarrinhoItem {
    id: string;
    quantity: number;
    price: number;
    name: string;
}

export interface Venda {
    ID_Venda?: string;
    Data?: string;
    Cliente?: string;
    Total: number;
    ItemsJSON?: string;
    items?: CarrinhoItem[];
    customerId?: string;
    customerName?: string;
}

export interface OrderPayload {
    itens: {
        id: string;
        nome: string;
        price: number;
        quantity: number;
    }[];
    total: number;
    nome: string;
    torre: string;
    apartamento: string;
    pagamento: string;
    entrega: string;
    observacoes: string;
    referralCode?: string;
    estimatedPoints?: number;
    [key: string]: any;
}

export interface Banner {
    id: string;
    image: string;
    title: string;
}
