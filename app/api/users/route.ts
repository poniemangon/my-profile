import { createServiceClient } from "@/lib/supabase/server";
import { Webhook } from 'svix';
import { NextRequest } from 'next/server';
import { generateAndSaveQRCode } from "@/lib/qr/saveqr";



export async function POST(req: NextRequest) {
    try {
      // Obtener el payload del webhook
      const payload = await req.text();
      const headers = req.headers;
      
      // Verificar el webhook con Svix
      const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
      interface ClerkUserCreatedEvent {
        type: string;
        data: {
          id: string;
          first_name?: string;
          last_name?: string;
          email_addresses?: Array<{ email_address: string }>;
          // Puedes agregar más campos según la estructura que recibes.
        };
        // Otros campos posibles en el webhook pueden configurarse aquí
      }

      const evt = webhook.verify(payload, {
        'svix-id': headers.get('svix-id')!,
        'svix-timestamp': headers.get('svix-timestamp')!,
        'svix-signature': headers.get('svix-signature')!,
      }) as ClerkUserCreatedEvent;
      
      // Debug: Log completo del evento
      console.log('=== WEBHOOK EVENT RECEIVED ===');
      console.log('Event type:', evt.type);
      console.log('Event data:', JSON.stringify(evt, null, 2));
      console.log('================================');
      
      // Verificar que el evento sea de creación de usuario
      if (evt.type === 'user.created') {
        console.log('🎉 Processing user.created event');
        const { data: clerkData } = evt;
      
        const supabase = createServiceClient();
      
        // Crear objeto inicial sin qr_code
        const userData = {
          clerk_id: clerkData.id,
          first_name: clerkData.first_name || '',
          last_name: clerkData.last_name || '',
          email: clerkData.email_addresses?.[0]?.email_address || '',
          url_slug: `${(clerkData.first_name || '').toLowerCase().replace(/\s+/g, '-')}-${(clerkData.last_name || '').toLowerCase().replace(/\s+/g, '-')}`,
        };
      
        // Verificar si el slug ya existe
        const { data: existingSlugData, error: slugError } = await supabase
          .from('user_profiles')
          .select('url_slug')
          .eq('url_slug', userData.url_slug)
          .single();
      
        if (slugError && slugError.code !== '23505') {
          // PGRST116 = not found, es normal si no existe
          console.error('Error checking slug:', slugError);
          return new Response('Error checking slug', { status: 500 });
        }
      
        if (existingSlugData) {
          userData.url_slug += '-1';
        }
      
        // Insertar usuario en Supabase
        const { data: insertedUser, error: insertError } = await supabase
          .from('user_profiles')
          .insert(userData)
          .select()
          .single();
      
        if (insertError) {
          console.error('❌ Error inserting user:', insertError);
          return new Response('Error inserting user', { status: 500 });
        }
      
        // Generar QR usando el ID real de Supabase
        const qrCode = await generateAndSaveQRCode(insertedUser.id);
      
        // Actualizar el registro con el QR generado
        const { error: insertQRCodeError } = await supabase
          .from('user_links')
          .insert({
            user_profile_id: insertedUser.id,
            qr_code: qrCode,
            redirect_url: process.env.NEXT_PUBLIC_BASE_URL + '/' + insertedUser.id,
            type: 'profile'
          })
      
        if (insertQRCodeError) {
          console.error('❌ Error updating QR code:', insertQRCodeError);
          return new Response('Error updating QR code', { status: 500 });
        }
      
        console.log('✅ User created successfully:', { ...insertedUser });
      }
      

      if (evt.type === 'user.deleted'){
        console.log('🗑️ Processing user.deleted event');
        const { data } = evt;
        const userId = data.id;
        console.log('🔍 Deleting user with ID:', userId);
        const supabase = createServiceClient();
        const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('clerk_id', userId);

        if (error) {
          console.error('❌ Error deleting user:', error);
          return new Response('Error deleting user', { status: 500 });
        }

        console.log('✅ User deleted successfully:', userId);
      }

      // Log para eventos no manejados
      if (evt.type !== 'user.created' && evt.type !== 'user.deleted') {
        console.log('⚠️ Unhandled event type:', evt.type);
      }
  
      return new Response('Webhook received', { status: 200 })
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return new Response('Error verifying webhook', { status: 400 })
    }
  }