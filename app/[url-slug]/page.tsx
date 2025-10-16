import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function PublicProfile({ params }: { params: { 'url-slug': string } }) {
    const { 'url-slug': urlSlug } = params;


    const supabase = createServiceClient();
    const { data: userProfile, error } = await supabase.from("user_profiles").select("*").eq("url_slug", urlSlug).single();
    if (!userProfile) {
        redirect("/");
    }
    return (
        <div>
            <h1>{userProfile.first_name} {userProfile.last_name}</h1>
            <p>{userProfile.email}</p>
            <Image src={userProfile.qr_code as string} alt="QR Code" width={100} height={100} />
        </div>
    )
}
