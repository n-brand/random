# Erzeugt das Halloween-Resource-Pack (halloween-pack.zip) und die Blockbench-Projekte der Huete.
# Aufruf: python build.py  (im Ordner blockbench/halloween, keine Abhaengigkeiten)
#
# Inhalt des Packs:
# - gruselige Kuerbis-Gesichter (geschnitzter Kuerbis und Kuerbislaterne), Kuerbis-Seiten und -Deckel
# - zwei Huete als 3D-Modell auf dem geschnitzten Kuerbis (Custom Model Data 1001 und 1002)
# - durchsichtiges Kuerbis-Overlay, damit man mit Hut auf dem Kopf normal sieht
#
# Einheiten der Huete wie beim Cowboyhut: Spielerkopf = 0..16, vorne = Norden (-z).

import base64, io, json, random, struct, uuid, zipfile, zlib
from pathlib import Path

OUT = Path(__file__).parent


# --- PNG ---

def png_bytes(px):
    h, w = len(px), len(px[0])
    raw = b"".join(b"\x00" + bytes(v for p in row for v in p) for row in px)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def canvas(w, h, color=(0, 0, 0, 0)):
    return [[color] * w for _ in range(h)]


def clamp(c):
    return tuple(max(0, min(255, int(v))) for v in c)


def shade(c, n):
    return clamp((c[0] + n, c[1] + n, c[2] + n)) + (255,)


# --- Kuerbis-Texturen (16x16) ---

ORANGE = (226, 128, 28)
RIB = (176, 88, 14)
HOLE = (34, 14, 6)
GLOW_IN = (255, 236, 120)
GLOW_OUT = (255, 152, 26)


def pumpkin_side(seed=1):
    rnd = random.Random(seed)
    px = canvas(16, 16)
    for y in range(16):
        for x in range(16):
            base = RIB if x in (0, 4, 11, 15) else ORANGE
            if x in (3, 5, 10, 12):
                base = tuple((a + b) // 2 for a, b in zip(ORANGE, RIB))
            px[y][x] = shade(base, rnd.randint(-10, 8) - (6 if y in (0, 15) else 0))
    return px


def pumpkin_top():
    rnd = random.Random(2)
    px = canvas(16, 16)
    for y in range(16):
        for x in range(16):
            d = max(abs(x - 7.5), abs(y - 7.5))
            base = RIB if d < 2.5 or (x in (7, 8) or y in (7, 8)) and d < 7 else ORANGE
            px[y][x] = shade(base, rnd.randint(-10, 8))
    # Stiel
    for y in range(6, 10):
        for x in range(6, 10):
            px[y][x] = shade((74, 92, 34), rnd.randint(-12, 6))
    return px


# Gesicht als Maske: 1 = Loch. Boese Augen, Dreiecksnase, gezackter Mund mit Zaehnen.
FACE = [
    "................",
    "................",
    "................",
    "..11........11..",
    "..111......111..",
    "..1111....1111..",
    "...111....111...",
    "...............",
    ".......11.......",
    "......1111......",
    "..............",
    ".11.11111111.11.",
    ".11111111111111.",
    "..111.1111.111..",
    "...1...11...1...",
    "................",
]


def pumpkin_face(lit):
    px = pumpkin_side(seed=3)
    for y, row in enumerate(FACE):
        for x, ch in enumerate(row.ljust(16, ".")):
            if ch != "1":
                continue
            if lit:
                # Leuchten: innen hell, zum Rand der Oeffnung orange
                edge = any(FACE[yy][xx:xx + 1] != "1" for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1))
                           if 0 <= yy < 16 and 0 <= xx < 16)
                px[y][x] = clamp(GLOW_OUT if edge else GLOW_IN) + (255,)
            else:
                px[y][x] = HOLE + (255,)
    return px


def pack_icon():
    # 64x64: Kuerbislaterne auf dunkelviolettem Grund
    face = pumpkin_face(lit=True)
    px = canvas(64, 64, (36, 18, 52, 255))
    for y in range(16):
        for x in range(16):
            for dy in range(3):
                for dx in range(3):
                    px[8 + y * 3 + dy][8 + x * 3 + dx] = face[y][x]
    return px


# --- Hut-Textur (32x32, Bereiche fuer beide Huete) ---

TEX = 32
REGIONS = {
    "felt":  ((0, 0, 8, 8),   (44, 30, 58)),    # Hexenhut, dunkles Violett
    "felt_top": ((8, 0, 8, 8), (58, 40, 76)),
    "felt_under": ((16, 0, 8, 8), (28, 18, 38)),
    "band":  ((24, 0, 8, 8),  (232, 120, 24)),  # orangefarbenes Hutband
    "gold":  ((0, 8, 8, 8),   (122, 214, 72)),  # gruene Schnalle
    "horn":  ((8, 8, 8, 8),   (186, 26, 30)),   # Teufelshoerner
    "horn_dark": ((16, 8, 8, 8), (120, 14, 18)),
    "horn_tip": ((24, 8, 8, 8), (36, 20, 20)),
}


def hat_texture():
    rnd = random.Random(7)
    px = canvas(TEX, TEX)
    for name, ((x0, y0, w, h), color) in REGIONS.items():
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                c = shade(color, rnd.randint(-8, 8))
                if name == "gold":
                    edge = x - x0 in (0, 7) or y - y0 in (0, 7)
                    hole = 2 <= x - x0 <= 5 and 2 <= y - y0 <= 5
                    c = clamp((30, 20, 40)) + (255,) if hole else shade((84, 168, 46), 0) if edge else c
                if name == "band" and y - y0 in (1, 6) and x % 2 == 0:
                    c = shade((150, 70, 10), 0)
                px[y][x] = c
    return px


def uv(region):
    (x, y, w, h), _ = REGIONS[region]
    s = 16 / TEX
    return [x * s, y * s, (x + w) * s, (y + h) * s]


# --- Hut-Modelle ---

# name, from, to, (Seiten, oben, unten), Drehung (Achse, Winkel, Drehpunkt) oder None
FELT = ("felt", "felt_top", "felt_under")
HATS = {
    "hexenhut": {
        "title": "Hexenhut",
        "cmd": 1001,
        "elements": [
            ("Krempe",   [-6, 15, -6],          [22, 16.5, 22],        FELT, None),
            ("Stufe 1",  [-0.75, 16.5, -0.75],  [16.75, 20, 16.75],    FELT, None),
            ("Hutband",  [-1, 16.5, -1],        [17, 18.5, 17],        ("band", "band", "band"), None),
            ("Schnalle", [6, 16.25, -1.25],     [10, 18.75, -1],       ("gold", "gold", "gold"), None),
            ("Stufe 2",  [1.5, 20, 1.5],        [14.5, 23.5, 14.5],    FELT, None),
            ("Stufe 3",  [3.5, 23.5, 3.5],      [12.5, 27, 12.5],      FELT, None),
            # Spitze knickt nach hinten ab
            ("Stufe 4",  [5, 26.5, 5],          [11, 30, 11],          FELT, ("x", 22.5, [8, 26.5, 8])),
            ("Spitze",   [6.5, 28.5, 9],        [9.5, 32, 12],         FELT, ("x", 45, [8, 28.5, 10.5])),
        ],
    },
    "teufelshoerner": {
        "title": "Teufelshoerner",
        "cmd": 1002,
        "elements": [],
    },
}

# Hoerner: links bauen, rechts spiegeln (x -> 16 - x, Winkel umkehren)
HORN = [
    # Spitzen biegen nach aussen (links = -x; positiver Winkel um z kippt das obere Ende Richtung -x)
    ("Horn Basis",  [1, 15.5, 5.5],  [4.5, 19, 9],    ("horn", "horn", "horn_dark"), None),
    ("Horn Mitte",  [1.25, 18.5, 5.75], [4.25, 22, 8.75], ("horn", "horn", "horn_dark"), ("z", 22.5, [2.75, 18.5, 7.25])),
    # Spitze sitzt auf dem gekippten Ende der Mitte (3.5 lang, 22.5 Grad: 1.34 nach aussen, 3.23 hoch)
    ("Horn Spitze", [0.4, 21.5, 6.25], [2.4, 25, 8.25], ("horn_tip", "horn_tip", "horn_tip"), ("z", 45, [1.4, 21.5, 7.25])),
]
for side, sign in (("links", 1), ("rechts", -1)):
    for name, a, b, mat, rot in HORN:
        if sign == 1:
            fa, fb, frot = a, b, rot
        else:
            fa = [16 - b[0], a[1], a[2]]
            fb = [16 - a[0], b[1], b[2]]
            frot = (rot[0], -rot[1], [16 - rot[2][0], rot[2][1], rot[2][2]]) if rot else None
        HATS["teufelshoerner"]["elements"].append((f"{name} {side}", fa, fb, mat, frot))

FACES = ["north", "east", "south", "west", "up", "down"]
DISPLAY = {
    # Kopf = 16 Einheiten; Minecraft zeigt 16 Einheiten auf dem Kopf etwas groesser als den Kopf an
    "head": {"translation": [0, 0, 0], "scale": [0.8, 0.8, 0.8]},
    "gui": {"rotation": [25, -135, 0], "translation": [0, -2, 0], "scale": [0.4, 0.4, 0.4]},
    "ground": {"translation": [0, 2, 0], "scale": [0.3, 0.3, 0.3]},
    "fixed": {"scale": [0.5, 0.5, 0.5]},
}


def faces_for(mat, java):
    side, top, under = mat
    return {f: {"uv": uv(top if f == "up" else under if f == "down" else side), "texture": "#0" if java else 0}
            for f in FACES}


def java_model(hat):
    elements = []
    for name, a, b, mat, rot in hat["elements"]:
        e = {"name": name, "from": a, "to": b, "faces": faces_for(mat, True)}
        if rot:
            e["rotation"] = {"angle": rot[1], "axis": rot[0], "origin": rot[2]}
        elements.append(e)
    return {
        "credit": f"{hat['title']} von Nicolas Brand",
        "texture_size": [TEX, TEX],
        "textures": {"0": "halloween:item/huete", "particle": "halloween:item/huete"},
        "elements": elements,
        "display": DISPLAY,
    }


def bbmodel(hat, png):
    elements = []
    for name, a, b, mat, rot in hat["elements"]:
        r = [0, 0, 0]
        if rot:
            r["xyz".index(rot[0])] = rot[1]
        elements.append({
            "name": name, "box_uv": False, "rescale": False, "locked": False,
            "render_order": "default", "allow_mirror_modeling": True,
            "from": a, "to": b, "autouv": 0, "color": 0,
            "origin": rot[2] if rot else [(a[i] + b[i]) / 2 for i in range(3)], "rotation": r,
            "faces": faces_for(mat, False), "type": "cube", "uuid": str(uuid.uuid4()),
        })
    return {
        "meta": {"format_version": "4.10", "model_format": "java_block", "box_uv": False},
        "name": hat["title"].lower(), "parent": "", "ambientocclusion": True, "front_gui_light": False,
        "visible_box": [1, 1, 0], "resolution": {"width": 16, "height": 16},
        "elements": elements, "outliner": [e["uuid"] for e in elements],
        "textures": [{
            "path": "", "name": "huete.png", "folder": "item", "namespace": "halloween", "id": "0",
            "width": TEX, "height": TEX, "uv_width": 16, "uv_height": 16,
            "particle": False, "render_mode": "default", "render_sides": "auto", "frame_time": 1,
            "visible": True, "internal": True, "saved": False, "uuid": str(uuid.uuid4()),
            "source": "data:image/png;base64," + base64.b64encode(png).decode(),
        }],
        "display": DISPLAY,
    }


# --- Pack zusammenbauen ---

def pack_files():
    hat_png = png_bytes(hat_texture())
    files = {
        # Mehrere Versionen: altes pack_format plus Bereich fuer neuere Versionen (gleiches Schema wie aktuelle Packs fuer 26.x)
        "pack.mcmeta": json.dumps({"pack": {
            "description": "Halloween von Nicolas Brand",
            "pack_format": 15, "min_format": 15, "max_format": [97, 1], "supported_formats": [15, 97],
        }}, indent=2),
        "pack.png": png_bytes(pack_icon()),
        "assets/minecraft/textures/block/carved_pumpkin.png": png_bytes(pumpkin_face(lit=False)),
        "assets/minecraft/textures/block/jack_o_lantern.png": png_bytes(pumpkin_face(lit=True)),
        "assets/minecraft/textures/block/pumpkin_side.png": png_bytes(pumpkin_side()),
        "assets/minecraft/textures/block/pumpkin_top.png": png_bytes(pumpkin_top()),
        "assets/minecraft/textures/misc/pumpkinblur.png": png_bytes(canvas(16, 16)),
        "assets/halloween/textures/item/huete.png": hat_png,
    }
    for key, hat in HATS.items():
        files[f"assets/halloween/models/item/{key}.json"] = json.dumps(java_model(hat), indent=2)

    hats = sorted(HATS.items(), key=lambda kv: kv[1]["cmd"])
    # Ab 1.21.4: Item-Definition waehlt das Modell ueber custom_model_data (floats)
    files["assets/minecraft/items/carved_pumpkin.json"] = json.dumps({"model": {
        "type": "range_dispatch", "property": "custom_model_data", "index": 0,
        "fallback": {"type": "model", "model": "block/carved_pumpkin"},
        "entries": [{"threshold": h["cmd"], "model": {"type": "model", "model": f"halloween:item/{k}"}} for k, h in hats],
    }}, indent=2)
    # Vor 1.21.4: overrides im Item-Modell
    files["assets/minecraft/models/item/carved_pumpkin.json"] = json.dumps({
        "parent": "block/carved_pumpkin",
        "overrides": [{"predicate": {"custom_model_data": h["cmd"]}, "model": f"halloween:item/{k}"} for k, h in hats],
    }, indent=2)
    return files, hat_png


if __name__ == "__main__":
    files, hat_png = pack_files()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for path in sorted(files):
            data = files[path]
            z.writestr(path, data.encode("utf-8") if isinstance(data, str) else data)
    (OUT / "halloween-pack.zip").write_bytes(buf.getvalue())
    for key, hat in HATS.items():
        (OUT / f"{key}.bbmodel").write_text(json.dumps(bbmodel(hat, hat_png), indent=2), encoding="utf-8")
    (OUT / "pack.png").write_bytes(files["pack.png"])
    print("ok:", ", ".join(sorted(p.name for p in OUT.iterdir() if p.suffix in (".zip", ".bbmodel", ".png"))))
