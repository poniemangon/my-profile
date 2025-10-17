import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { generateAndSaveQRCode } from "@/lib/qr/saveqr";

export async function POST(req: NextRequest) {
    try {
        const supabase = createServiceClient();
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const body = await req.json();
        const { url, type } = body;
        if(!url || !type) {
            return NextResponse.json({ error: "URL y tipo son requeridos" }, { status: 400 });
        }
        if(!type) {
            return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
        }
        
        const { data, error } = await supabase
        .from('user_links')
        .insert({ type, user_profile_id: userId, redirect_url: url, qr_code: '-' })
        .select()
        .single();
        if(error) {
            return NextResponse.json({ error: "Error al crear link" }, { status: 500 });
        }
        const qrCode = await generateAndSaveQRCode(data.id);
        const { error: updateQRCodeError } = await supabase
        .from('user_links')
        .update({ qr_code: qrCode })
        .eq('id', data.id);
        if(updateQRCodeError) {
            return NextResponse.json({ error: "Error al actualizar QR code" }, { status: 500 });
        }
        return NextResponse.json({ data: data.id }); 
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al crear link" }, { status: 500 });
    }
}