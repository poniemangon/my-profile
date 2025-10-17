"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamic import para evitar SSR issues con Leaflet
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

// CSS is now imported globally in globals.css

// Import L solo en el cliente
let L: any = null;
if (typeof window !== "undefined") {
  L = require("leaflet");
}

type Link = {
  id: number;
  type: string;
  redirect_url: string;
  qr_code: string | null;
  user_profile_id: string;
  created_at: string;
};

type Click = {
  id: number;
  lat: number | null;
  lng: number | null;
  ip_address: string;
  created_at: string;
};






export default function LinkDetailsPage() {
  const params = useParams();
  const linkId = params?.["link-id"];
  const [link, setLink] = useState<Link | null>(null);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClick, setSelectedClick] = useState<Click | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    async function fetchLink() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/get-link?link-id=${linkId}`);
        const result = await res.json();
        if (res.ok && result.data?.link) {
          setLink(result.data.link);
          setClicks(result.data.clicks ?? []);
        } else {
          setError(result.error || "No se pudo cargar el link.");
        }
      } catch (err) {
        setError("Error al cargar el link.");
      } finally {
        setLoading(false);
      }
    }

    if (linkId) fetchLink();
  }, [linkId]);

  // Función para manejar click en una fila
  const handleClickRow = (click: Click) => {
    setSelectedClick(click);
    
    // Centrar el mapa en la ubicación seleccionada
    if (mapRef.current && click.lat && click.lng) {
      mapRef.current.setView([click.lat, click.lng], 15);
    }
  };

  // Obtener clicks válidos (con coordenadas)
  const validClicks = clicks.filter((c) => c.lat !== null && c.lng !== null);
  
  // Calcular centro del mapa
  const mapCenter = validClicks.length > 0 
    ? [
        validClicks.reduce((acc, c) => acc + (c.lat ?? 0), 0) / validClicks.length,
        validClicks.reduce((acc, c) => acc + (c.lng ?? 0), 0) / validClicks.length
      ]
    : [-34.6037, -58.3816]; // Buenos Aires por defecto

  return (
    <div className="container mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Detalles del Link</h1>
      {loading ? (
        <div className="text-gray-500">Cargando...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : link ? (
        <div className="bg-white rounded shadow p-4">
          <table className="min-w-full text-sm border mb-6">
            <tbody>
              <tr>
                <td className="font-semibold px-2 py-1 border">Tipo</td>
                <td className="capitalize px-2 py-1 border">{link.type}</td>
              </tr>
              <tr>
                <td className="font-semibold px-2 py-1 border">URL</td>
                <td className="px-2 py-1 border break-all">
                  <a
                    href={link.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {link.redirect_url}
                  </a>
                </td>
              </tr>
              <tr>
                <td className="font-semibold px-2 py-1 border">QR Code</td>
                <td className="px-2 py-1 border">
                  {link.qr_code ? (
                    <Image
                      src={link.qr_code}
                      alt="QR code"
                      width={120}
                      height={120}
                      className="rounded border"
                    />
                  ) : (
                    <span className="text-gray-400">No generado</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="font-semibold px-2 py-1 border">Creado</td>
                <td className="px-2 py-1 border">
                  {new Date(link.created_at).toLocaleString("es-AR")}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Clicks (mapa de ubicaciones)</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Lista de clicks */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Lista de Clicks</h3>
                <div className="max-h-64 overflow-y-auto border rounded">
                  {validClicks.length > 0 ? (
                    validClicks.map((click) => (
                      <div
                        key={click.id}
                        onClick={() => handleClickRow(click)}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedClick?.id === click.id ? 'bg-blue-100 border-blue-300' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">IP: {click.ip_address}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(click.created_at).toLocaleString("es-AR")}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {click.lat?.toFixed(4)}, {click.lng?.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No hay clicks geolocalizados
                    </div>
                  )}
                </div>
              </div>

              {/* Mapa */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Mapa</h3>
                {typeof window !== "undefined" && L ? (
                  <MapContainer
                    center={mapCenter as [number, number]}
                    zoom={validClicks.length > 1 ? 10 : 15}
                    style={{ height: "256px", width: "100%" }}
                    ref={mapRef}
                    className="rounded border"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {validClicks.map((click) => (
                      <Marker
                        key={click.id}
                        position={[click.lat!, click.lng!]}
                        icon={L.divIcon({
                          className: `bg-black rounded-full ${selectedClick?.id === click.id ? 'ring-2 ring-blue-500' : ''}`,
                          html: '<div style="width:10px;height:10px;background:#000;border-radius:50%"></div>',
                          iconSize: [10, 10],
                          iconAnchor: [5, 5],
                        })}
                      />
                    ))}
                  </MapContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center border rounded bg-gray-100">
                    <div className="text-gray-500">Cargando mapa...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">No se encontró el link.</div>
      )}
    </div>
  );
}


