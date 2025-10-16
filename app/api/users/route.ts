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
        const { data } = evt;
        // Extraer los datos del usuario del webhook
        const userData = {
          clerk_id: data.id,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email_addresses?.[0]?.email_address || '',
          url_slug: `${(data.first_name || '').toLowerCase().replace(/\s+/g, '-')}-${(data.last_name || '').toLowerCase().replace(/\s+/g, '-')}`,
          qr_code: '',
        };
        const supabase = createServiceClient();
        const existingSlug = await supabase.from('user_profiles').select('url_slug').eq('url_slug', userData.url_slug).single();

        if (existingSlug) {
          userData.url_slug = userData.url_slug + '-' + '1';
        }
        const qrCode = await generateAndSaveQRCode(userData.url_slug);
        userData.qr_code = qrCode;
        console.log('📝 Inserting user data:', userData);
        



        const { error } = await supabase
          .from('user_profiles')
          .insert(userData);

        if (error) {
          console.error('❌ Error inserting user:', error);
          return new Response('Error inserting user', { status: 500 });
        }

        console.log('✅ User created successfully:', userData);
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