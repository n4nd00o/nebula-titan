/**
 * Servidor estático mínimo para desenvolvimento (sem dependências).
 *
 * Por que é necessário? Navegadores bloqueiam módulos ES (import/export)
 * quando a página é aberta direto do disco (file://). Basta servir a pasta
 * por HTTP. Uso:  npm start   ->   http://localhost:5173
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let relative = decodeURIComponent(url.pathname);
    if (relative.endsWith('/')) relative += 'index.html';

    const filePath = path.resolve(ROOT, `.${relative}`);
    // Impede acesso a arquivos fora da pasta do projeto (path traversal).
    if (!filePath.startsWith(ROOT + path.sep)) {
      res.writeHead(403).end('Acesso negado');
      return;
    }

    const info = await stat(filePath).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 - Não encontrado');
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch (error) {
    console.error(error);
    res.writeHead(500).end('Erro interno');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n  NEBULA TITAN');
  console.log(`  Jogo:        http://localhost:${PORT}`);
  console.log(`  Modo debug:  http://localhost:${PORT}/?debug`);
  console.log('  (Ctrl+C para parar)\n');
});
