'use client';

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type UserProfile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  clerk_id: string;
  url_slug: string;
  created_at: string;
};

export default function AddLink() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    async function fetchUserProfile() {
      const supabase = createClient();
      if (user?.id) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("clerk_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
        } else {
          setUserProfile(data);
        }
      }
    }
    fetchUserProfile();
  }, [user?.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const url = formData.get("url") as string;
    const type = formData.get("type") as string;

    if (!url) {
      toast.error("La URL no puede estar vacía");
      return;
    }
    if (!type) {
      toast.error("El tipo no puede estar vacío");
      return;
    }

    const response = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, type }),
    });

    const data = await response.json();
    if (response.ok) {
      toast.success("Link agregado correctamente");
      // Optionally clear the form or redirect, as needed
    } else {
      toast.error(data.error || "Error al agregar el link");
    }
  }

  return (
    <div>
      <h1>Agregar Link {userProfile?.email}</h1>
      <div className="form-wrapper">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md">
          <input
            type="url"
            name="url"
            className="p-1 px-2 rounded-lg mt-5 border shadow-md border-sky-500"
            placeholder="https://tusitio.com"
          />
          <input
            type="text"
            name="type"
            className="p-1 px-2 rounded-lg border shadow-md border-sky-500"
            placeholder="Tipo de enlace (ej: portfolio, github, etc)"
          />
          <button
            type="submit"
            className="p-1 hover:bg-black px-2 rounded-lg bg-sky-500 text-white shadow-md"
          >
            Agregar Link
          </button>
        </form>
      </div>
    </div>
  );
}
