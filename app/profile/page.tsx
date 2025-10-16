import { getUserProfile } from "@/lib/supabase/users";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function Profile() {
    const { userId } = await auth();
    
    if (!userId) {
        redirect('/');
    }

    const userProfile = await getUserProfile(userId);

   

    


  return (
    <div className="container">
        <h1>Profile</h1>
        {userProfile ? (
            <div>                
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Profile:</strong> {userProfile.first_name} {userProfile.last_name}</p>
                <p><strong>QR Code:</strong> <Image src={userProfile.qr_code} alt="QR Code" width={100} height={100} /></p>
                <Link href="/profile/edit">Editar URL del perfil</Link>
            </div>
        ) : (
            <p>Profile not found</p>
        )}
    </div>
  );
}