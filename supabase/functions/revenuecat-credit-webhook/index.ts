import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') || '';

const CREDIT_EVENT_TYPES = new Set([
  'NON_RENEWING_PURCHASE',
  'INITIAL_PURCHASE',
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function getBearerToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
}

function mapStoreToPlatform(store?: string) {
  const normalized = String(store || '').toLowerCase();
  if (normalized.includes('app_store') || normalized.includes('app-store')) return 'apple';
  if (normalized.includes('play_store') || normalized.includes('play-store')) return 'google';
  if (normalized.includes('stripe')) return 'manual';
  return normalized.includes('google') ? 'google' : 'apple';
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  if (REVENUECAT_WEBHOOK_SECRET && getBearerToken(req) !== REVENUECAT_WEBHOOK_SECRET) {
    return json({ error: 'unauthorized' }, 401);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const event = payload?.event || payload;
  const eventType = String(event?.type || '');

  if (!CREDIT_EVENT_TYPES.has(eventType)) {
    return json({ success: true, skipped: true, reason: 'ignored_event_type', eventType });
  }

  const userId = event?.app_user_id || event?.aliases?.[0];
  const productId = event?.product_id;
  const transactionId = event?.transaction_id || event?.original_transaction_id || event?.id;
  const platform = mapStoreToPlatform(event?.store);

  if (!userId || !productId || !transactionId) {
    return json({ error: 'missing_required_event_fields' }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const productColumn = platform === 'google' ? 'google_product_id' : 'apple_product_id';
  const { data: pack, error: packError } = await supabase
    .from('alimtalk_packages')
    .select('id')
    .eq(productColumn, productId)
    .eq('is_active', true)
    .maybeSingle();

  if (packError) {
    return json({ error: packError.message }, 500);
  }

  if (!pack?.id) {
    return json({ error: 'package_not_found', productId, platform }, 404);
  }

  const { data, error } = await supabase.rpc('charge_alimtalk_credits', {
    p_user_id: userId,
    p_package_id: pack.id,
    p_payment_platform: platform,
    p_payment_tx_id: transactionId,
    p_payment_receipt: JSON.stringify({
      source: 'revenuecat',
      event_id: event?.id,
      product_id: productId,
      purchased_at_ms: event?.purchased_at_ms,
    }),
  });

  if (error) {
    return json({ error: error.message }, 500);
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.success && result?.error !== 'duplicate_payment') {
    return json({ success: false, result }, 400);
  }

  return json({
    success: true,
    duplicate: result?.error === 'duplicate_payment',
    packageId: pack.id,
    creditsAdded: result?.credits_added || 0,
    newBalance: result?.new_balance ?? null,
  });
});
