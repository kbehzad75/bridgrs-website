// Minimal static file server for Bridgrs marketing site
// Uses only Node built-ins — no external deps required.

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm':  'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.pdf':  'application/pdf',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0].split('#')[0]);
  const resolved = path.normalize(path.join(root, decoded));
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function serveFile(res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const cache = /\.(html|htm|xml|txt)$/i.test(ext)
      ? 'public, max-age=300'
      : 'public, max-age=31536000, immutable';
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stat.size,
      'Cache-Control': cache,
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    return;
  }
  const parsed = url.parse(req.url);
  const target = safeJoin(ROOT, parsed.pathname || '/');
  if (!target) {
    send(res, 400, 'Bad Request');
    return;
  }
  fs.stat(target, (err, stat) => {
    if (!err && stat.isDirectory()) {
      serveFile(res, path.join(target, 'index.html'));
      return;
    }
    if (!err && stat.isFile()) {
      serveFile(res, target);
      return;
    }
    // Fallback: try .html extension, else 404
    const htmlTry = target.endsWith('.html') ? null : target + '.html';
    if (htmlTry && fs.existsSync(htmlTry)) {
      serveFile(res, htmlTry);
      return;
    }
    send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
  });
});

server.listen(PORT, () => {
  console.log(`Bridgrs marketing site listening on port ${PORT}`);
});
