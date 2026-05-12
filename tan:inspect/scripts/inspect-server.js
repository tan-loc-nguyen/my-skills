const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 7777;
const LOG_FILE = process.env.INSPECT_LOG_FILE
  ? path.resolve(process.cwd(), process.env.INSPECT_LOG_FILE)
  : path.join(process.cwd(), '.claude', 'inspect.log');

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      fs.appendFileSync(LOG_FILE, body + '\n');
      res.writeHead(200);
      res.end('ok');
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Inspect log server listening on http://127.0.0.1:${PORT}`);
  console.log(`Writing to ${LOG_FILE}`);
});
