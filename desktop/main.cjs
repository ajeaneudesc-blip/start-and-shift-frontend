const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

// Le bundle web d'Expo (`npx expo export --platform web`) référence ses assets
// en chemins absolus (« /_expo/static/... »), qui en file:// pointeraient sur
// la racine du disque : fenêtre blanche. On le sert donc en HTTP local, ce qui
// règle aussi le CORS (en file:// le navigateur envoie « Origin: null », que
// l'API refuse) et rend localStorage stable entre deux lancements.
// Port 8081 : celui du serveur de développement Expo, déjà listé dans
// ALLOWED_ORIGINS côté backend — rien à changer là-bas.
const PORT = 8081;
// `www/` est rempli par `npm run sync` depuis ../web-dist : la coque est un
// paquet npm séparé de l'app Expo parce qu'electron-builder impose le champ
// `main` du package.json, or celui de l'app doit rester `index.ts` pour Metro.
const ROOT = path.join(__dirname, 'www');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function serve(req, res) {
  const pathname = decodeURIComponent(url.parse(req.url).pathname || '/');
  // path.normalize + préfixe imposé : sans ça, « /../../ » sortirait de web-dist.
  const target = path.normalize(path.join(ROOT, pathname));
  const inside = target === ROOT || target.startsWith(ROOT + path.sep);

  // Navigation côté client (React Navigation) : toute route inconnue retombe
  // sur index.html.
  const file = inside && fs.existsSync(target) && fs.statSync(target).isFile()
    ? target
    : path.join(ROOT, 'index.html');

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('Bundle introuvable. Relancez « npm run sync » depuis desktop/.');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    // Fenêtre étroite : l'interface est dessinée pour un téléphone, l'étirer
    // sur 1400 px casserait toutes les mises en page de src/screens.
    width: 430,
    height: 900,
    show: false,
    backgroundColor: '#0B0B0D',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:/.test(target)) shell.openExternal(target);
    return { action: 'deny' };
  });

  win.loadURL(`http://localhost:${PORT}/`);
}

const server = http.createServer(serve);

app.whenReady().then(() => {
  server.on('error', (err) => {
    console.error(`Serveur local sur ${PORT} indisponible :`, err.message);
    createWindow();
  });
  server.listen(PORT, '127.0.0.1', () => createWindow());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  server.close();
  if (process.platform !== 'darwin') app.quit();
});
