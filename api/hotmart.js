const { createClient } = require('@supabase/supabase-js');
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken:false, persistSession:false } });
const GRANT  = new Set(['PURCHASE_APPROVED','PURCHASE_COMPLETE']);
const REVOKE = new Set(['PURCHASE_REFUNDED','PURCHASE_CHARGEBACK','PURCHASE_CANCELED','PURCHASE_PROTEST','SUBSCRIPTION_CANCELLATION']);
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error:'method not allowed' });
  const body = req.body || {};
  const hottok = req.headers['x-hotmart-hottok'] || body.hottok;
  if (process.env.HOTMART_HOTTOK && hottok !== process.env.HOTMART_HOTTOK) return res.status(401).json({ error:'invalid hottok' });
  const data = body.data || {};
  const event = body.event || '';
  const email = (data.buyer?.email || data.subscriber?.email || '').trim().toLowerCase();
  const transaction = data.purchase?.transaction || body.id || '';
  if (!email || !event) return res.status(200).json({ ok:true, ignored:true });
  const idem = transaction + ':' + event;
  const { data: seen } = await admin.from('processed_webhooks').select('transaction').eq('transaction', idem).maybeSingle();
  if (seen) return res.status(200).json({ ok:true, duplicate:true });
  if (GRANT.has(event)) {
    await admin.from('entitlements').upsert({ email, status:'active', hotmart_transaction:transaction, granted_at:new Date().toISOString(), revoked_at:null }, { onConflict:'email' });
  } else if (REVOKE.has(event)) {
    await admin.from('entitlements').update({ status:'revoked', revoked_at:new Date().toISOString() }).eq('email', email);
  }
  await admin.from('processed_webhooks').insert({ transaction: idem, email, event });
  return res.status(200).json({ ok:true });
};
