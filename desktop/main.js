// Batverse als Desktop-App (Nicolas 2026-11-18: "wie kann man das als App umbauen, damit die F-Tasten und Rechtsklick nicht nerven" -> "Ja, Electron-App").
// Laedt die Dateien direkt aus dem Repo (Ordner darueber) ueber ein eigenes Protokoll batverse://app/ (feste Herkunft: Spielstand im localStorage bleibt erhalten).
// three.js kommt aus node_modules statt von unpkg (laeuft offline). Kein Browser-Menue, kein Kontextmenue; Tasten: F11 Vollbild, F5 neu laden, F2 Spiel <-> Werkstatt, F12 Entwicklerwerkzeuge.
const { app, BrowserWindow, protocol, net, dialog, Menu, shell } = require("electron");
const path = require("path"), fs = require("fs"), { pathToFileURL } = require("url");

const ROOT = path.join(__dirname, "..");                                   // Repo C:\Source\random
const THREE_DIR = path.join(__dirname, "node_modules", "three");           // three@0.160.0 wie in der Importmap
const UNPKG = "https://unpkg.com/three@0.160.0/";
const SEITE = { spiel: "batverse://app/sachen/batverse/", werkstatt: "batverse://app/sachen/batverse/werkstatt/" };

protocol.registerSchemesAsPrivileged([{ scheme: "batverse", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

// Datei innerhalb von base ausliefern (kein Zugriff ausserhalb), Ordner -> index.html
function datei(base, rel) {
  let p = path.normalize(path.join(base, decodeURIComponent(rel)));
  if (!p.startsWith(base)) return new Response("Zugriff verweigert", { status: 403 });
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, "index.html"); } catch (e) { return new Response("Nicht gefunden: " + rel, { status: 404 }); }
  return net.fetch(pathToFileURL(p).toString());
}

function fenster() {
  const werkstatt = process.argv.includes("--werkstatt");
  const win = new BrowserWindow({ width: 1600, height: 900, minWidth: 800, minHeight: 500, backgroundColor: "#000000", title: "Batverse", autoHideMenuBar: true, icon: path.join(ROOT, "icon.svg"),
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: false } });
  win.loadURL(werkstatt ? SEITE.werkstatt : SEITE.spiel);
  // Tasten der App (vor der Seite): F11 Vollbild, F5 neu laden, F2 Spiel <-> Werkstatt, F12 Entwicklerwerkzeuge; alle anderen Tasten gehen ans Spiel
  win.webContents.on("before-input-event", (e, k) => {
    if (k.type !== "keyDown") return;
    if (k.key === "F11") { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (k.key === "F5") { win.webContents.reload(); e.preventDefault(); }
    else if (k.key === "F12") { win.webContents.toggleDevTools(); e.preventDefault(); }
    else if (k.key === "F2") { win.loadURL(win.webContents.getURL().includes("/werkstatt/") ? SEITE.spiel : SEITE.werkstatt); e.preventDefault(); }
  });
  // Das Spiel fragt beim Verlassen nach (beforeunload); Electron wuerde das Schliessen sonst stumm verhindern
  win.webContents.on("will-prevent-unload", e => {
    const w = dialog.showMessageBoxSync(win, { type: "question", buttons: ["Schliessen", "Abbrechen"], defaultId: 0, cancelId: 1, title: "Batverse", message: "Batverse wirklich verlassen?", detail: "Der Spielstand wird dabei gespeichert." });
    if (w === 0) e.preventDefault();
  });
  // Links nach aussen (z. B. Footer) im normalen Browser oeffnen, keine neuen Fenster in der App
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); } });
  win.on("page-title-updated", e => e.preventDefault());
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);                                           // keine Menueleiste, keine Browser-Tastenkuerzel
  protocol.handle("batverse", req => { const u = new URL(req.url); return datei(ROOT, u.pathname); });
  protocol.handle("https", req => req.url.startsWith(UNPKG) ? datei(THREE_DIR, req.url.slice(UNPKG.length)) : net.fetch(req, { bypassCustomProtocolHandlers: true }));   // three.js lokal
  fenster();
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) fenster(); });
});
app.on("window-all-closed", () => app.quit());
