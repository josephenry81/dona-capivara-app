import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa Supabase Admin (necessário para bypassar RLS se necessário, ou usar o anon key se a tabela for pública)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Idealmente usar a SERVICE_ROLE_KEY aqui
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('📬 [Webhook WAHA] Recebido:', body);

        // Suporte ao formato WAHA (WhatsApp HTTP API)
        // O WAHA envia: { event: "message", payload: { body: "...", from: "..." } }
        const isWaha = body.event && body.payload;
        const messageText = isWaha ? body.payload.body : (body.text?.message || body.text || '');
        const sender = isWaha ? body.payload.from : (body.sender || '');


        // Tentar extrair o ID do pedido (Padrão: ID: XXXX)
        const orderIdMatch = messageText.match(/ID:\s*([A-Z0-9]+)/i);
        const orderId = orderIdMatch ? orderIdMatch[1].toUpperCase() : null;

        if (!orderId) {
            console.log('⚠️ [Webhook] Mensagem sem ID de pedido válido.');
            return NextResponse.json({ success: true, message: 'Skipped - No ID found' });
        }

        console.log(`✅ [Webhook] Confirmando pedido ${orderId} para o remetente ${sender}`);

        // 1. Atualizar status no banco (Supabase)
        // Aqui assumimos que os pedidos agora são persistidos também no Supabase
        const { error: dbError } = await supabase
            .from('orders')
            .update({ status: 'Confirmado', updated_at: new Date().toISOString() })
            .eq('short_id', orderId);

        if (dbError) {
            console.error('❌ [Webhook] Erro ao atualizar banco:', dbError);
            // Mesmo com erro no banco, tentamos seguir para o push se o ID for válido
        }

        // 2. Disparar Push Notification
        // Buscamos a subscrição salva na Fase 2
        const { data: subscriptionData } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .eq('user_id', sender) // Ou usar o ID do usuário vinculado ao pedido
            .single();

        if (subscriptionData?.subscription) {
            const subscription = JSON.parse(subscriptionData.subscription);

            // Aqui você usaria uma biblioteca como 'web-push' enviando o payload:
            // { title: "Dona Capivara", body: "✅ Seu pedido foi recebido com sucesso!", url: "/pedidos" }

            console.log('🔔 [Webhook] Disparando Push para subscrição encontrada.');

            // Simulação de disparo (Requer 'npm install web-push' e chaves VAPID no server)
            /*
            await webpush.sendNotification(subscription, JSON.stringify({
                title: "Dona Capivara",
                body: `Seu pedido ${orderId} foi confirmado!`,
                url: "/?tab=perfil"
            }));
            */
        }

        return NextResponse.json({ success: true, orderId });

    } catch (error) {
        console.error('💥 [Webhook Error]:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
