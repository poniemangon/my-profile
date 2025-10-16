import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { generateAndSaveQRCode } from "@/lib/qr/saveqr";

export async function POST(req: NextRequest) {
    try {
        const supabase = createServiceClient();

        // Verificar sesión con Clerk
        const { userId } = await auth();

       
        if (!userId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }
        console.log(userId);
        const body = await req.json();
        const { url_slug } = body;
        console.log(url_slug);

       

        if (!url_slug) {
            return NextResponse.json({ error: "Slug vacío" }, { status: 400 });
        }

        // Chequear si existe el slug
        const { data: existingSlug } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("url_slug", url_slug)
            .single();
   
        if (existingSlug) {

            return NextResponse.json({ error: "Slug existente" }, { status: 409 });
        }
        
        const newSlug = url_slug.toLowerCase().replace(/\s+/g, '-');
        const { data, error } = await supabase
        .from("user_profiles")
        .update({ url_slug: newSlug })
        .eq("clerk_id", userId).select();
        if (error) {
            return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
        }
        const oldQrCode = data[0]?.qr_code;
        // Elimina toda la url del qr code excepto el nombre del archivo
        const parts = oldQrCode?.split('/');
        const fileName = parts?.[parts.length - 1];
        const { data: removeError } = await supabase.storage
        .from("qr-codes") // nombre del bucket
        .remove([fileName]); // ruta(s) exacta(s) dentro del bucket
        if (removeError) {
            NextResponse.json({ error: "Error al eliminar el QR code" }, { status: 500 });
        }
        const qrCode = await generateAndSaveQRCode(newSlug);
        const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ qr_code: qrCode })
        .eq("clerk_id", userId);
        if (updateError) {
            return NextResponse.json({ error: "Error al actualizar el QR code" }, { status: 500 });
        }

        return NextResponse.json({ message: "Slug actualizado" });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
    }
}
