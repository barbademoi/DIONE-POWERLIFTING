const { createClient } = require('@supabase/supabase-js');
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken:false, persistSession:false } });
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error:'method not allowed' });
  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return res.status(400).json({ error:'email invalido' });

  // 1) confere se o e-mail comprou e está ativo
  const { data: ent } = await admin.from('entitlements').select('status').eq('email', email).maybeSingle();
  if (!ent || ent.status !== 'active') return res.status(403).json({ error:'nao_encontrado' });

  // 2) garante que existe um usuário no Supabase pra esse e-mail
  let userId = null;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, email_confirm:true });
  if (created?.user) userId = created.user.id;
  if (cErr) {
    // já existe: busca na lista de usuários
    const { data: list } = await admin.auth.admin.listUsers();
    const found = list?.users?.find(u => (u.email||'').toLowerCase() === email);
    if (found) userId = found.id;
  }
  if (!userId) return res.status(500).json({ error:'user_fail' });

  // 3) gera um link mágico e extrai o token (NÃO envia e-mail) para criar a sessão no cliente
  const { data: link, error: lErr } = await admin.auth.admin.generateLink({ type:'magiclink', email });
  if (lErr || !link?.properties) return res.status(500).json({ error:'link_fail' });

  return res.status(200).json({ ok:true, email_otp: link.properties.email_otp, hashed_token: link.properties.hashed_token, verification_type: link.properties.verification_type });
};
