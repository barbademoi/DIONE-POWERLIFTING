const CACHE='dione-pl-v18';
const SHELL=['./','./index.html','./app.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  .then(()=>self.clients.claim())
  // Destrava clientes presos numa versao antiga: recarrega as abas abertas 1x
  .then(()=>self.clients.matchAll({type:'window'}).then(cs=>cs.forEach(c=>{try{c.navigate(c.url)}catch(_){}})))
)});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  // Outros dominios (ex.: CDN do Supabase): cache-first simples
  if(url.origin!==location.origin){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));return res}).catch(()=>r)));
    return;
  }
  // Paginas (HTML): network-first -> sempre pega a versao nova quando online; cai pro cache offline
  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));return res})
      .catch(()=>caches.match(req).then(r=>r||caches.match('./app.html')).then(r=>r||caches.match('./index.html')))
    );
    return;
  }
  // Assets estaticos (imagens, css, etc.): cache-first
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));return res})));
});
