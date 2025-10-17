"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Coords = { lat: number; lng: number };

function RedirectInner() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [ip, setIp] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const redirectId = useSearchParams().get("redirect_id");

  // Obtener GPS
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error("GPS rechazado o error:", err);
          setCoords(null); // Podés usar null si no acepta
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Obtener IP
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => setIp(data.ip))
      .catch((err) => console.error(err));
  }, []);

  // Llamar al endpoint para obtener URL de redirección
  useEffect(() => {
    console.log('llego');
  
    const fetchRedirect = async () => {
      try {
        const response = await fetch("/api/redirect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coords: coords ?? null,
            ip: ip ?? null,
            redirectId: redirectId ?? null,
          }),
        });
  
        if (response.ok) {
          const data = await response.json();
          setRedirectUrl(data.redirectUrl);
          window.location.href = data.redirectUrl;
        } else {
          console.error("Error en la respuesta del endpoint:", response.status);
        }
      } catch (error) {
        console.error("Error al obtener URL de redirección:", error);
      }
    };
  
    fetchRedirect();
  }, [coords, ip, redirectId]);
  

  if (!coords && !ip) return <p>Obteniendo ubicación…</p>;

  return (
    <div>
      {!redirectUrl && <p>Redirigiendo…</p>}
    </div>
  );

}

export default function Redirect() {
  return (
    <Suspense fallback={<p>Redirigiendo…</p>}>
      <RedirectInner />
    </Suspense>
  );
}
