// app/api/loc/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        
        const body = await request.json();
        const { coords, ip, redirectId } = body;
        console.log(coords, ip, redirectId);
        const supabase = createServiceClient();
        const { data, error } = await supabase
        .from("user_links")
        .select("*")
        .eq("id", redirectId)
        .single();


        
        if(!data) {
            return NextResponse.json({ redirectUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1" }, { status: 200 });
        }
        if (error) {
            return NextResponse.json({ error: "Error al obtener URL de redirección" }, { status: 500 });
        }
        if(data.type === 'profile') {
            const { data: userProfile, error: userProfileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", data.user_profile_id)
            .single();
            if(userProfileError) {
                return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
            }
            const redirectUrl = '/' + userProfile.url_slug;
            return NextResponse.json({ redirectUrl: redirectUrl }, { status: 200 });
        }
        
        if(body.ip && body.coords) {
            const {  error } = await supabase
            .from("link_clicks")
            .insert({
                ip_address: ip,
                lat: coords.lat,
                lng: coords.lng,
                user_link_id: redirectId,
            })
            .single();
            if(error) {
                return NextResponse.json({ error: "Error al registrar click" }, { status: 500 });
            }
        }
        return NextResponse.json({ redirectUrl: data.redirect_url }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al obtener URL de redirección" }, { status: 500 });
    }
}
