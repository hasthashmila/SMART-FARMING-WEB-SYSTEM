'use strict';
/* Server-Sent Events hub: pushes live updates to the digital-twin dashboard. */
const clients = new Set();

function subscribe(req, res, user) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no',
  });
  res.write(`event: hello\ndata: ${JSON.stringify({ ts: new Date().toISOString() })}\n\n`);
  const client = { res, userId: user.id, role: user.role };
  clients.add(client);
  const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch { /* closed */ } }, 25000);
  req.on('close', () => { clearInterval(ping); clients.delete(client); });
}

function broadcast(type, payload = {}, filter = null) {
  const msg = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const c of clients) {
    if (filter && !filter(c)) continue;
    try { c.res.write(msg); } catch { clients.delete(c); }
  }
}

module.exports = { subscribe, broadcast, count: () => clients.size };
