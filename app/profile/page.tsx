import { getUserProfile } from "@/lib/supabase/users";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type UserLink = {
  id: number;
  type: string;
  redirect_url: string;
  qr_code: string | null;
  user_profile_id: string;
  created_at: string;
};

type UserProfile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  clerk_id: string;
  url_slug: string;
  created_at: string;
  links: UserLink[];
};

export default async function Profile() {
    const { userId } = await auth();
    console.log(userId);
    
    if (!userId) {
        redirect('/');
    }

    const userProfile = await getUserProfile(userId) as UserProfile | null;

    const profileQr = userProfile?.links.find((link: UserLink) => link.type === 'profile');

  return (
    <div className="container">
        <h1>Profile</h1>
        {userProfile ? (
            <div>                
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Profile:</strong> {userProfile.first_name} {userProfile.last_name}</p>
                <p><strong>QR Code:</strong> <Image src={profileQr?.qr_code || ''} alt="QR Code" width={100} height={100} /></p>
                <Link href="/profile/edit">Editar URL del perfil</Link>
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Tus Links</h2>
                
                {userProfile.links && userProfile.links.filter((link: UserLink) => link.type !== 'profile').length > 0 ? (
                    <div className="max-h-48 overflow-y-auto border rounded-lg bg-white shadow">
                        <div className="flex flex-col">
                            {userProfile.links.filter((link: UserLink) => link.type !== 'profile').map((link: UserLink) => (
                                <Link
                                    key={link.id}
                                    href={`/profile/link/${link.id}`}
                                    className="p-4 border-b hover:bg-blue-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                                                    {link.type}
                                                </span>
                                                <span className="text-sm text-gray-600 break-all">
                                                    {link.redirect_url}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            {link.qr_code ? (
                                                <Image
                                                    src={link.qr_code}
                                                    alt="QR Code"
                                                    width={40}
                                                    height={40}
                                                    className="rounded border"
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-xs">Sin QR</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 border rounded-lg bg-gray-50">
                        <p className="text-lg font-medium">No tienes links asociados</p>
                        <p className="text-sm mt-1">Agrega tu primer link para comenzar</p>
                    </div>
                )}
                
                <div className="mt-4">
                    <Link
                        href="/profile/add-link"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar Link
                    </Link>
                </div>
            </div>
            </div>
        ) : (
            <p>Profile not found</p>
        )}
    </div>
  );
}