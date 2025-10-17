import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";


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
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        
        if (!slugRegex.test(url_slug)) {
            return NextResponse.json({ error: "Slug contiene caracteres no permitidos" }, { status: 400 });
        }
        const { error } = await supabase
        .from("user_profiles")
        .update({ url_slug: newSlug })
        .eq("clerk_id", userId).select();
        if (error) {
            return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
        }
 

        return NextResponse.json({ message: "Slug actualizado" });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
    }
}
