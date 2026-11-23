const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = __dirname;
const PORTA = Number(process.env.PORT) || 3000;

const TIPOS_MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function resolverArquivo(urlRequisitada) {
  const urlLimpa = decodeURIComponent((urlRequisitada || "/").split("?")[0]);
  const relativo = urlLimpa === "/" ? "index.html" : urlLimpa.replace(/^\/+/, "");
  const caminhoAbsoluto = path.resolve(RAIZ, relativo);

  if (!caminhoAbsoluto.startsWith(RAIZ)) {
    return null;
  }

  if (fs.existsSync(caminhoAbsoluto) && fs.statSync(caminhoAbsoluto).isDirectory()) {
    const indexDir = path.join(caminhoAbsoluto, "index.html");
    return fs.existsSync(indexDir) ? indexDir : null;
  }

  return fs.existsSync(caminhoAbsoluto) ? caminhoAbsoluto : null;
}

const servidor = http.createServer((req, res) => {
  const arquivo = resolverArquivo(req.url);

  if (!arquivo) {
    const pagina404 = path.join(RAIZ, "404.html");
    if (fs.existsSync(pagina404)) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(pagina404).pipe(res);
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Página não encontrada.");
    return;
  }

  const ext = path.extname(arquivo).toLowerCase();
  const tipo = TIPOS_MIME[ext] || "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": tipo,
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(arquivo).pipe(res);
});

servidor.listen(PORTA, "127.0.0.1", () => {
  console.log(`Torino Online disponível em http://localhost:${PORTA}/index.html`);
  console.log(`Painel admin em http://localhost:${PORTA}/admin/login.html`);
});
