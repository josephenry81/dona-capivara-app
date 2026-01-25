import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('📬 [Webhook n8n] Recebido:', body);

        // n8n envia { orderId: "...", sender: "..." }
        const { orderId, sender } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, error: 'No orderId provided' }, { status: 400 });
        }

        console.log(`✅ [n8n Webhook] Confirmando pedido ${orderId}`);

        // Atualiza status no Supabase
        const { error: dbError } = await supabase
            .from('orders')
            .update({ status: 'Confirmado', updated_at: new Date().toISOString() })
            .eq('short_id', orderId);

        if (dbError) {
            console.error('❌ [Webhook] Erro no banco:', dbError);
            return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, orderId });

    } catch (error) {
        console.error('💥 [Webhook Error]:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
