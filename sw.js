const TIMERS = new Map();

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATIONS') {
    scheduleNotifications(event.data.attrezzature || []);
  } else if (event.data && event.data.type === 'CLEAR_TIMERS') {
    clearAllTimers();
  }
});

function scheduleNotifications(attrezzature) {
  clearAllTimers();
  const now = Date.now();
  attrezzature.forEach(item => {
    if (!item.id || !item.scad) return;
    const scadenza = new Date(item.scad + 'T00:00:00').getTime();
    if (isNaN(scadenza)) return;
    
    const offsets = [
      { label: '60 giorni', ms: -60 * 24 * 60 * 60 * 1000 },
      { label: '30 giorni', ms: -30 * 24 * 60 * 60 * 1000 },
      { label: '10 giorni', ms: -10 * 24 * 60 * 60 * 1000 },
      { label: 'scadenza', ms: 0 }
    ];
    
    offsets.forEach(offset => {
      const notifyTime = scadenza + offset.ms;
      const delay = notifyTime - now;
      if (delay > 0) {
        const timerId = setTimeout(() => {
          showNotification(item, offset.label);
          TIMERS.delete(item.id + '_' + offset.label);
        }, delay);
        TIMERS.set(item.id + '_' + offset.label, timerId);
      }
    });
  });
}

function clearAllTimers() {
  for (const [key, timerId] of TIMERS.entries()) {
    clearTimeout(timerId);
  }
  TIMERS.clear();
}

function showNotification(item, tipo) {
  const title = `⚠️ Attrezzatura ${tipo}`;
  const options = {
    body: `${item.persona} - ${item.tipo} (${item.matricola})\nScadenza: ${item.scad}`,
    icon: 'icons/launchericon-192x192.png', // Usa la tua icona reale
    tag: 'attrezzatura-' + item.id,
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };
  self.registration.showNotification(title, options);
}

// Periodic Background Sync (funziona solo su Chrome Android, dopo engagement)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-attrezzature') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clients => {
        if (clients && clients.length > 0) {
          clients[0].postMessage({ type: 'REQUEST_RESCHEDULE' });
        }
      })
    );
  }
});
