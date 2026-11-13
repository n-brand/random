# Spuren oben an den Rampen (Variante B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An beiden offenen Rampen der Uferstrasse versteht man oben, welche Spur nach unten geht und welche oben bleibt. Keine Spur endet ins Nichts, und am Strassenende ist die Strasse wieder voll breit.

**Architecture:** Die Geometrie bleibt bis auf `gdeckUp` (volle Breite statt Trichter). Neue Markierungen entstehen in `gotham-unterstrasse.js` im Block „Rampen an offenen Enden“:
- weisse Streifen ins vorhandene Netz `LW`,
- Pfeile und Schrift als Abziehbilder in einem neuen Netz `MK` mit Canvas-Atlas.

Auf dem Deck in der Portalzone (80 m nach dem Portal) zeichnet `gotham-strassen.js` die Fahrbahn mit der 2-Spur-Textur `A2` (ohne gestrichelte Spurlinien). Die Spurlinien dort setzt `MK`/`LW` selbst.

**Tech Stack:** three.js 0.160, klassische Skripte mit gemeinsamen Globals, keine Build-Tools. Tests: Prüfausdrücke per `javascript_tool` in der Vorschau (`http://localhost:4180/sachen/batverse/?debug`) und Bildschirmfotos.

**Spec:** `docs/superpowers/specs/2026-11-13-rampen-spuren-oben-design.md`

## Global Constraints

- Rampenmasse unverändert: `GDECK.RW` 7, `FL` 30, `RL` 80; Portal = `r.sA` (Ende A) bzw. `r.sB` (Ende B).
- Rechtsverkehr. Rechte Normale zur Fahrtrichtung (dx, dz) ist (-dz, dx).
- Linienfarben wie bisher: weiss `#d8d8d2` (Material von `LW`), Linienbreite 0,16 m.
- Schrift auf der Fahrbahn: „LOWER“.
- Kein Commit ohne ausdrückliches OK von Nicolas (Regel seit 2026-11-13). Nie pushen.
- Nach der Änderung `CACHE` in `sw.js` +1 und `CLAUDE.md` (Batverse-Abschnitt) nachführen.
- Kollision unverändert, ausser: Gehsteig-Keil weg (Boden oben = Fahrbahn bis `w/2`).

## Review Focus

- Fahrzeug fährt vom Strassenende auf die obere Spur und darf nicht an einer unsichtbaren Kante (alter Keil, 15 cm) hängen bleiben. Test in Task 1.
- Die Portalzone auf dem Deck darf nicht doppelt gezeichnet werden (A4 und A2 übereinander flimmern). Test in Task 2 (keine Überlappung der Indizes).
- Abziehbilder dürfen nicht über dem offenen Schacht schweben. Test in Task 3 (`gdeckOpen` an jeder Abziehbild-Mitte false).
- Der Strassen-Zwischenspeicher muss nach der Änderung neu rechnen (Datei-Hash). Prüfung in Task 2: `GSTR.done` und neuer Netzname vorhanden.
- Seitenstrassen in der Rampenzone müssen gefunden werden (3 Stück: West 108 m, Ost 42 m und 85 m vor dem Ende). Test in Task 4.

---

### Task 1: Volle Breite am Strassenende (kein Gehsteig-Keil)

**Files:**
- Modify: `sachen/batverse/js/gotham/gotham-gelaende.js:291-293` (`gdeckUp`)
- Modify: `sachen/batverse/js/gotham/gotham-unterstrasse.js` (Naht-Fläche im Block „Rampen an offenen Enden“, `for (const d of [-RW / 2, RW / 2])` -> `[-r.w / 2, r.w / 2]`)

**Interfaces:**
- Produces: `gdeckUp(r, s) -> number` liefert immer `r.w / 2` (bleibt als Funktion bestehen, Aufrufer unverändert).

- [ ] **Step 1: Prüfausdruck vorher ausführen (soll scheitern)**

```js
const r = GDECK.roads.find(o => o.id === "ufer-ost"), [x, z, nx, nz] = [r.pts[0][0], r.pts[0][1], 0, 0];
const P = (s, d) => { const j = r.s.findIndex(v => v >= s); const a = r.pts[j - 1], b = r.pts[j], l = Math.hypot(b[0]-a[0], b[1]-a[1]); return [a[0] + (b[0]-a[0]) * (s - r.s[j-1]) / l + -(b[1]-a[1]) / l * d, a[1] + (b[1]-a[1]) * (s - r.s[j-1]) / l + (b[0]-a[0]) / l * d]; };
[gothamDeckAt(...P(3, 5), GOT.STR), gothamDeckAt(...P(3, -5), GOT.STR)]   // erwartet nach dem Fix: [-12, -12]
```

Expected vorher: `-11.85` (Gehsteig 15 cm) an mindestens einer Stelle.

- [ ] **Step 2: `gdeckUp` auf `r.w / 2`, Naht-Fläche auf volle Breite**
- [ ] **Step 3: Neu laden, Prüfausdruck: beide Werte -12. Bildschirmfoto von oben bei -2797/-308: kein Keil.**

### Task 2: Deck-Fahrbahn in der Portalzone ohne gestrichelte Spurlinien

**Files:**
- Modify: `sachen/batverse/js/gotham/gotham-gelaende.js` (neu nach `gdeckInRamp`)
- Modify: `sachen/batverse/js/gotham/gotham-strassen.js:139` (Band der Hauptstrassen)

**Interfaces:**
- Produces: `gdeckPortalU(r, s) -> number`: Abstand hinter dem Portal ins Deck (0..`GDECK.PZ`), sonst -1. Ende A: `s - r.sA`, Ende B: `r.sB - s`, nur an offenen Enden. Neue Konstante `GDECK.PZ = 80`.
- Produces: `gdeckPortalZone(x, z) -> boolean` = `gdeckNear(x, z, 12)` mit `n.d < n.r.w / 2 + 0.6` und `gdeckPortalU(n.r, n.s) >= 0`.

- [ ] **Step 1: Prüfausdruck vorher**

```js
GSTR.meshes.some(m => m && m.name === "Gotham-Strassen Portalzone")   // erwartet nach dem Fix: true
```

- [ ] **Step 2: In `gotham-strassen.js` bei `r.zweistock`:**
  - erstes Band mit skip `(x, z) => gdeckOpen(x, z) || gdeckPortalZone(x, z)`,
  - zweites Band mit `A2`-Material in eigenem Geo `PZ` (gleiche Parameter wie das erste) und skip `(x, z) => !gdeckPortalZone(x, z) || gdeckOpen(x, z)`,
  - Netz `make(PZ, mat(lineTex(false), 2), "Gotham-Strassen Portalzone")`; dazu `PZ` in die äusseren geo-Deklarationen (Zwischenspeicher, wie `Kies`/`XL`).
- [ ] **Step 3: Neu laden (Zwischenspeicher rechnet neu), Prüfausdruck true; Bildschirmfoto Deck bei -2690/-319: keine gestrichelten Linien in den ersten 80 m.**

### Task 3: Linien und Pfeile an den Rampen (flacher Teil, Rampe, Portalzone)

**Files:**
- Modify: `sachen/batverse/js/gotham/gotham-unterstrasse.js` (Atlas, Geo `MK`, Helfer `decal`, Block „Rampen an offenen Enden“, `GDECK.meshes`)

**Interfaces:**
- Consumes: `gdeckPortalU`, `GDECK.PZ` (Task 2), `sub`, `flat`, `LW`.
- Produces:
  - Atlas `mkTex` (Canvas 512 x 128, 4 Kacheln je 128 px): 0 Pfeil geradeaus, 1 „LOWER“ mit Pfeil schräg nach unten, 2 Einfädelpfeil nach rechts, 3 Pfeil „nur rechts“.
  - `decal(x, z, dx, dz, w, l, tile, y)`: legt ein Rechteck w (quer) x l (längs, Spitze in Fahrtrichtung dx/dz) mit Atlas-Kachel `tile` auf Höhe y ins Geo `MK`.
  - Material: `alphaTest` 0.5, polygonOffset 3.
  - Netz „Gotham-Rampen Markierung“.

Für jedes offene Ende gilt u = Abstand vom Strassenende (0 am Ende, `FL` am Rampenbeginn, `FL + RL` am Portal). Die Fahrtrichtung „hinein“ ist die Richtung zum Deck.

- [ ] **Step 1: Prüfausdruck vorher**

```js
GDECK.meshes.some(m => m && m.name === "Gotham-Rampen Markierung")   // erwartet nach dem Fix: true
```

- [ ] **Step 2: Flacher Teil (u 0..FL)**
  - Trennlinie bei d = ±RW/2: gestrichelt (3 m Strich, 3 m Lücke) für u < FL - 15, dann durchgezogen bis FL.
  - Randlinie aussen bei d = ±(w/2 - 0,25) über die ganze Rampenzone (u 0..FL+RL).
  - Pfeile nur für „hinein“ (rechte Seite in Fahrtrichtung zum Deck):
    - innen, Mitte d = RW/4: Kachel 1 bei u 8 und 20 (w 2,4, l 5);
    - aussen, Mitte d = (RW/2 + w/2)/2: Kachel 0 bei u 8 und 20 (w 1,6, l 5).
- [ ] **Step 3: Rampe (u FL..FL+RL):** Kachel 0 auf der oberen Spur beider Richtungen alle 25 m, jeweils in deren Fahrtrichtung.
- [ ] **Step 4: Portalzone (Deck, 0..PZ hinter dem Portal)**
  - Sperrfläche je Seite in der inneren Spur: Keil von voller Spurbreite (d 0,1..RW/2) am Portal auf 0 bei 30 m. Umrisslinie plus Schrägstriche alle 2 m (Streifen 0,3 m, 45 Grad) ins Geo `LW`.
  - Gestrichelte Spurlinie bei d = ±RW/2 ab 30 m bis PZ (schliesst an die Textur-Striche danach an).
  - Kachel 2 (Einfädeln nach rechts) in der inneren Spur der Richtung „hinaus“ (zum Portal hin) bei 40, 55 und 70 m.
- [ ] **Step 5: Prüfung**
  - Neu laden, Prüfausdruck true.
  - Jede Abziehbild-Mitte prüfen: `gdeckOpen(x, z) === false` (Test-Schleife über eine Debug-Liste `GDECK.mkPts`, die beim Bau die Mitten sammelt).
  - Bildschirmfotos beider Enden von oben und aus Fahrersicht.

### Task 4: Seitenstrassen an der Rampe: nur rechts

**Files:**
- Modify: `sachen/batverse/js/gotham/gotham-unterstrasse.js` (gleicher Block, nach Task 3)

**Interfaces:**
- Consumes: `GSTR.patches`, `GSTR.roads`, `decal`, `gdeckNearOn`, `GDECK.mkPts`.

- [ ] **Step 1: Seitenstrassen finden**
  - Kreuzungsflächen `p` mit `gdeckNearOn(r, p[0], p[1])`, wobei d < w/2 + 3 und u in (FL - 5 .. FL + RL + 5).
  - Dazu die nächste andere Strasse aus `GSTR.roads`, deren Linie bis 2 m an `p` heranreicht.
  - Prüfausdruck: `GDECK.sideJ.length === 3`.
- [ ] **Step 2: Markierung „nur rechts“**
  - In der Seitenstrasse 10 m vor der Kreuzungsfläche (Mitte der zufahrenden Spur, d = w/4) Kachel 3 in Fahrtrichtung zur Kreuzung.
  - Auf der Uferstrasse: durchgezogene Linie bei d = ±RW/2 über ±15 m um die Einmündung (ersetzt dort die Striche).
- [ ] **Step 3: Prüfung:** Prüfausdruck, Bildschirmfotos bei -2690/-319, -1009/1254 und -979/1287.

### Task 5: Fahrtest, Doku, Cache

**Files:**
- Modify: `sw.js` (CACHE +1), `CLAUDE.md` (Batverse, neuer Eintrag „Spuren oben an den Rampen“)

- [ ] **Step 1: Fahrtest per `?debug`** (Polizeiauto, `carStep` mit Tastenzustand), beide Enden:
  - vom Strassenende oben bleiben bis aufs Deck;
  - innen hinunter bis `LY`;
  - von unten hoch bis zum Ende;
  - auf dem Deck innen zum Portal und vorher rechts einfädeln.
  - Erwartet: Höhe oben -12 bzw. unten -17,5, nirgends stecken.
- [ ] **Step 2: Rechtsfahrt von der Seitenstrasse auf die Uferstrasse** bei allen drei Einmündungen.
- [ ] **Step 3: CACHE +1, CLAUDE.md-Eintrag, Ergebnis mit Bildern an Nicolas; nach seinem OK committen.**
