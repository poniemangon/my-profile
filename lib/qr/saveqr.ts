import QRCode from "qrcode";
import { createServiceClient } from "../supabase/server";

export async function generateAndSaveQRCode(urlSlug: string) {
  // Generar QR como buffer
  const qrBuffer = await QRCode.toBuffer(process.env.NEXT_PUBLIC_BASE_URL + '/' + urlSlug);

  // Subir el QR generado al bucket de supabase
  const supabase = createServiceClient();
  const filePath = `${urlSlug}.png`;
  const uploadResponse = await supabase.storage
    .from('qr-codes')
    .upload(filePath, qrBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadResponse.error) {
    throw uploadResponse.error;
  }

  // Construir la URL pública (ajustar el método según configuración pública del bucket)
  const url = supabase.storage.from('qr-codes').getPublicUrl(filePath).data.publicUrl;



  return url;
}
