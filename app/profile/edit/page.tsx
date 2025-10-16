'use client';

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Form from 'next/form';
import { toast } from "sonner";


export default function EditProfile() {
    const supabase = createClient();
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [placeholderSlug, setPlaceholderSlug] = useState(userProfile?.url_slug);

    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
          router.push('/');
        }
      }, [isLoaded, isSignedIn]);

    

    useEffect(() => {
        async function fetchUserProfile() {
            if (user?.id) {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('clerk_id', user?.id)
                    .single();
                 
                if (error) {
                    console.log('Error fetching user profile:', error);
                } else {
                    setUserProfile(data);
                    setPlaceholderSlug(data.url_slug);
                }
            }
        }
        fetchUserProfile();
    }, [user?.id]);

    const [urlSlug, setUrlSlug] = useState("");

    async function handleSubmit(formData: FormData) {
        const slug = formData.get("url_slug") as string;
      
        if (!slug) {
          toast.error("El slug no puede estar vacío");
          return;
        }
      
       const response = await fetch("/api/change-slug", {
        method: "POST",
        body: JSON.stringify({ url_slug: slug }),
       });
       const data = await response.json();
       if (response.ok) {
        toast.success(data.message);
        setPlaceholderSlug(slug);
       } else {
        toast.error(data.error);
       }
      }
      
      

    return (
        <div>
            <h1>Edit Profile{userProfile?.email}</h1>
            <div className="form-wrapper">
                <Form action={handleSubmit} className="flex gap-3">
                    <input type="text" name="url_slug" className="p-1 px-2 rounded-lg mt-5 border shadow-md border-sky-500" placeholder={placeholderSlug}/>
                    <button type="submit" className="p-1 hover:bg-black px-2 rounded-lg mt-5 bg-sky-500 text-white shadow-md ">Cambiar Slug</button>
                </Form>
            </div>
        </div>
    )
}