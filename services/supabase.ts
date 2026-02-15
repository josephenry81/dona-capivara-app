import { createClient } from '@supabase/supabase-js';

// ============================================================================
// 🚀 SUPABASE CLIENT - Cache ultra-rápido para catálogo
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 🔍 DEBUG: Log para verificar se as variáveis estão configuradas
if (typeof window !== 'undefined') {
    console.log('🔍 [Supabase Debug] URL configured:', !!supabaseUrl);
    console.log('🔍 [Supabase Debug] Key configured:', !!supabaseKey);
}

// Cliente Supabase (só inicializa se credenciais existirem)
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Verifica se o Supabase está configurado
 */
export function isSupabaseConfigured(): boolean {
    const configured = Boolean(supabaseUrl && supabaseKey && supabase);
    if (typeof window !== 'undefined' && !configured) {
        console.log('📁 [Supabase] Não configurado - usando Google Apps Script como fallback');
    }
    return configured;
}

/**
 * Busca catálogo completo do Supabase (produtos, categorias, banners)
 * Retorna dados formatados no mesmo schema que o Google Apps Script
 */
export async function fetchCatalogFromSupabase() {
    if (!supabase) {
        throw new Error('Supabase não configurado');
    }

    console.log('⚡ [Supabase] Buscando catálogo...');
    const startTime = Date.now();

    // Buscar tudo em paralelo para máxima velocidade
    const [productsRes, categoriesRes, bannersRes] = await Promise.all([
        supabase.from('products').select('*').eq('ativo', true).order('nome'),
        supabase.from('categories').select('*').order('ordem'),
        supabase.from('banners').select('*').eq('ativo', true).order('ordem')
    ]);

    // Verificar erros
    if (productsRes.error) {
        console.error('❌ [Supabase] Erro products:', productsRes.error);
        throw productsRes.error;
    }
    if (categoriesRes.error) {
        console.error('❌ [Supabase] Erro categories:', categoriesRes.error);
        throw categoriesRes.error;
    }
    if (bannersRes.error) {
        console.error('❌ [Supabase] Erro banners:', bannersRes.error);
        throw bannersRes.error;
    }

    const elapsed = Date.now() - startTime;
    console.log(`✅ [Supabase] Catálogo carregado em ${elapsed}ms`);

    // Formatar dados no mesmo schema que o GAS retorna
    return {
        products: (productsRes.data || []).map(p => ({
            id: p.id,
            nome: p.nome,
            price: Number(p.preco || 0),
            estoque: Number(p.estoque || 0),
            categoriaId: p.categoria_id,
            subcategoria: p.subcategoria || '',
            descricao: p.descricao || '',
            imagem: p.imagem_url || '',
            peso: p.peso || 'N/A',
            calorias: p.calorias || 'N/A',
            ingredientes: p.ingredientes || 'N/A',
            tempo: p.tempo_preparo || 'N/A',
            mostrar_catalogo: p.mostrar_catalogo !== false, // ✅ NOVA CAMPO
            dataLancamento: p.data_lancamento || null // ⏳ Timer lançamento
        })),
        categories: (categoriesRes.data || []).map(c => ({
            id: c.id,
            nome: c.nome,
            imagem: c.imagem_url || ''
        })),
        banners: (bannersRes.data || []).map(b => ({
            id: b.id,
            title: b.titulo || '',
            subtitle: b.subtitulo || '',
            image: b.imagem_url || '',
            ctaText: b.cta_text || ''
        }))
    };
}
