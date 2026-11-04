const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Connected Live-Reload Clients (SSE)
const sseClients = new Set();

const liveReloadScript = `
<!-- Local Dev Live-Reload -->
<script>
  (() => {
    let es;
    function connect() {
      es = new EventSource('/__livereload');
      es.onmessage = (e) => {
        if (e.data === 'reload') {
          console.log('[LiveReload] Change detected, reloading page...');
          window.location.reload();
        }
      };
      es.onerror = () => {
        es.close();
        setTimeout(connect, 2000);
      };
    }
    connect();
  })();
</script>
`;

// Debounce for file watcher
let reloadTimeout = null;
function notifyReload() {
  if (reloadTimeout) clearTimeout(reloadTimeout);
  reloadTimeout = setTimeout(() => {
    console.log(`[Watcher] File updated. Reloading ${sseClients.size} client(s)...`);
    for (const res of sseClients) {
      try {
        res.write('data: reload\n\n');
      } catch (e) {
        sseClients.delete(res);
      }
    }
  }, 250);
}

// Watch directory for changes
function watchFiles() {
  try {
    fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      const normalized = filename.replace(/\\/g, '/').toLowerCase();

      // Ignore git, scratch, task logs, temp files, node_modules, and server.js
      if (
        normalized.includes('.git') ||
        normalized.includes('node_modules') ||
        normalized.includes('scratch') ||
        normalized.includes('.system_generated') ||
        normalized.includes('logs') ||
        normalized === 'server.js' ||
        normalized.endsWith('.tmp')
      ) {
        return;
      }

      // Only notify reload for primary frontend assets (html, css, js)
      const ext = path.extname(normalized);
      if (!['.html', '.css', '.js'].includes(ext)) {
        return;
      }

      console.log(`[Watcher] Change detected in ${filename}. Notifying clients.`);
      notifyReload();
    });
    console.log('[Watcher] Watching workspace files for real-time live reload.');
  } catch (err) {
    console.log('[Watcher] Watcher not supported, manual refresh still works.');
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // LiveReload SSE endpoint
  if (pathname === '/__livereload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.normalize(path.join(ROOT_DIR, pathname));

  // Security check: ensure file is within ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Disable caching for local development
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', contentType);

    // If serving HTML, inject live-reload script before </body>
    if (ext === '.html') {
      fs.readFile(filePath, 'utf8', (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Internal Server Error');
          return;
        }

        let injected = content;
        if (content.includes('</body>')) {
          injected = content.replace('</body>', `${liveReloadScript}</body>`);
        } else {
          injected += liveReloadScript;
        }

        res.writeHead(200);
        res.end(injected);
      });
    } else {
      res.writeHead(200);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`
=============================================================
  ⚡ LOCAL LIVE SERVER ACTIVE
=============================================================
  Local URL:   http://localhost:${PORT}/
  Network URL: http://127.0.0.1:${PORT}/
  
  * Real-time live reload enabled.
  * No cache headers applied for instant design experimentation.
  * Changes to HTML, CSS, or JS will refresh your browser automatically.
=============================================================
`);
  watchFiles();
});
