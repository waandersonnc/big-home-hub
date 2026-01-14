import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";


const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { action, company_id, access_token } = await req.json();
        const FB_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
        const FB_APP_ID = Deno.env.get('FACEBOOK_APP_ID');

        if (!FB_APP_SECRET || !FB_APP_ID) {
            throw new Error('Configuração de servidor incompleta: Faltam chaves do Facebook.');
        }

        // Helper to generate App Secret Proof
        // Proof = HMAC-SHA256(access_token, app_secret)
        const generateProof = async (token: string, secret: string) => {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(secret);
            const data = encoder.encode(token);

            const key = await crypto.subtle.importKey(
                "raw",
                keyData,
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"]
            );

            const signature = await crypto.subtle.sign("HMAC", key, data);
            return Array.from(new Uint8Array(signature))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        };

        if (action === 'get_ad_accounts') {
            // Modo Seguro: O servidor chama o Facebook usando o App Secret Proof
            const proof = await generateProof(access_token, FB_APP_SECRET);

            const fbUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id,id,currency,account_status&access_token=${access_token}&appsecret_proof=${proof}`;

            const fbRes = await fetch(fbUrl);
            const fbData = await fbRes.json();

            if (fbData.error) {
                throw new Error(fbData.error.message);
            }

            return new Response(JSON.stringify({ data: fbData.data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        if (action === 'verify_permissions') {
            const proof = await generateProof(access_token, FB_APP_SECRET);
            const fbUrl = `https://graph.facebook.com/v18.0/me/permissions?access_token=${access_token}&appsecret_proof=${proof}`;

            const fbRes = await fetch(fbUrl);
            const fbData = await fbRes.json();

            if (fbData.error) {
                throw new Error(fbData.error.message);
            }

            return new Response(JSON.stringify({ data: fbData.data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        if (action === 'exchange_token') {
            // Exchange short-lived token for long-lived token
            const exchangeUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${access_token}`;

            const exRes = await fetch(exchangeUrl);
            const exData = await exRes.json();

            if (exData.access_token) {
                // Update integration with new long-lived token
                // Note: We update using supabase admin client to bypass RLS if needed, although service role has power.
                // But we actually just want to return it or update directly.
                // Let's update directly if company_id is provided.
                if (company_id) {
                    await supabase
                        .from('meta_integrations')
                        .update({
                            meta_access_token: exData.access_token,
                            // If facebook returns new expiry, we could save it too
                            updated_at: new Date().toISOString()
                        })
                        .eq('company_id', company_id);
                }

                return new Response(JSON.stringify({ success: true, new_token: exData.access_token }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }
        }

        return new Response(JSON.stringify({ error: 'Ação desconhecida' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
