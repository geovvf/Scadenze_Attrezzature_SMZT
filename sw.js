const TIMERS = new Map();
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATIONS') schedule(e.data.attrezzature);
});
function schedule(items) {
  TIMERS.forEach(t => clearTimeout(t)); TIMERS.clear();
  const now = Date.now();
  items.forEach(it => {
    if (!it.id || !it.scad) return;
    const scad = new Date(it.scad + 'T00:00:00').getTime();
    [-60, -30, -10, 0].forEach(day => {
      const delay = scad + day*86400000 - now;
      if (delay > 0) {
        const id = setTimeout(() => {
          const giorni = day === 0 ? 'SCADUTA OGGI' : (Math.abs(day) + ' giorni');
          self.registration.showNotification('⚠️ Attrezzatura ' + giorni, {
            body: it.persona + ' - ' + it.tipo + ' (' + it.matricola + ')\nScadenza: ' + it.scad,
            icon: '🔔', tag: 'attr-'+it.id, requireInteraction: true, vibrate: [200,100,200]
          });
          TIMERS.delete(it.id + '_' + day);
        }, delay);
        TIMERS.set(it.id + '_' + day, id);
      }
    });
  });
}