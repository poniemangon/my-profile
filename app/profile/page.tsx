import { getUserProfile } from "@/lib/supabase/users";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function Profile() {
    const { userId } = await auth();
    console.log(userId);
    
    if (!userId) {
        redirect('/');
    }

    const userProfile = await getUserProfile(userId);

    const profileQr = userProfile?.links.find((link: { type: string; qr_code: string; }) => link.type === 'profile');

  return (
    <div className="container">
        <h1>Profile</h1>
        {userProfile ? (
            <div>                
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Profile:</strong> {userProfile.first_name} {userProfile.last_name}</p>
                <p><strong>QR Code:</strong> <Image src={profileQr?.qr_code || ''} alt="QR Code" width={100} height={100} /></p>
                <Link href="/profile/edit">Editar URL del perfil</Link>
            {userProfile.links && userProfile.links.filter((link: any) => link.type !== 'profile').length > 0 ? (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Tus Links</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow border border-gray-200">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-100 to-cyan-100">
                                    <th className="px-4 py-2 text-left text-gray-700 font-medium">Tipo</th>
                                    <th className="px-4 py-2 text-left text-gray-700 font-medium">URL</th>
                                    <th className="px-4 py-2 text-left text-gray-700 font-medium">QR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userProfile.links.filter((link: any) => link.type !== 'profile').map((link: any) => (
                                    <tr key={link.id} className="border-t hover:bg-blue-50">
                                        <td className="px-4 py-2 capitalize">{link.type}</td>
                                        <td className="px-4 py-2 break-all">
                                            <a
                                                href={link.redirect_url}
                                                className="text-blue-600 hover:underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {link.redirect_url}
                                            </a>
                                        </td>
                                        <td className="px-4 py-2">
                                            {link.qr_code ? (
                                                <Image
                                                    src={link.qr_code}
                                                    alt="QR Code"
                                                    width={50}
                                                    height={50}
                                                    className="rounded border"
                                                />
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <p className="mt-8 text-gray-500 italic">No tenés otros links todavía.</p>
            )}
            </div>
        ) : (
            <p>Profile not found</p>
        )}
    </div>
  );
}