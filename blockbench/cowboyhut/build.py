# Erzeugt den Cowboyhut als Blockbench-Projekt, Java-Modell und Textur.
# Aufruf: python build.py  (im Ordner sachen/cowboyhut, keine Abhaengigkeiten)
#
# Einheiten: der Spielerkopf entspricht dem Bereich 0..16 auf allen Achsen
# (8 Skin-Pixel = 16 Einheiten). Die Krempe ist 30 Einheiten breit, also fast doppelt so breit wie der Kopf.

import base64, json, random, struct, uuid, zlib
from pathlib import Path

OUT = Path(__file__).parent
TEX = 32  # Texturgroesse in Pixeln, UV-Raum ist 0..16

# --- Textur ---

# Bereiche in der Textur (Pixel x, y, Breite, Hoehe) und ihre Grundfarbe
REGIONS = {
    "top":  ((0, 0, 8, 8),   (150, 98, 58)),   # Filz oben, heller
    "side": ((8, 0, 8, 8),   (124, 78, 44)),   # Filz Seiten
    "under": ((16, 0, 8, 8), (88, 54, 30)),    # Filz unten, dunkel
    "band": ((24, 0, 8, 8),  (52, 30, 18)),    # Hutband Leder
    "gold": ((0, 8, 8, 8),   (226, 178, 62)),  # Schnalle
}


def make_texture():
    rnd = random.Random(7)
    px = [[(0, 0, 0, 0)] * TEX for _ in range(TEX)]
    for name, ((x0, y0, w, h), (r, g, b)) in REGIONS.items():
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                n = rnd.randint(-9, 9)
                c = (r + n, g + n, b + n)
                if name == "band" and y - y0 in (1, 6) and x % 2 == 0:
                    c = (110, 78, 48)  # Naht
                if name == "gold":
                    edge = x - x0 in (0, 7) or y - y0 in (0, 7)
                    hole = 2 <= x - x0 <= 5 and 2 <= y - y0 <= 5
                    if hole:
                        c = (52, 30, 18)
                    elif edge:
                        c = (176, 128, 34)
                px[y][x] = tuple(max(0, min(255, v)) for v in c) + (255,)
    return px


def png_bytes(px):
    raw = b"".join(b"\x00" + bytes(v for p in row for v in p) for row in px)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    ihdr = struct.pack(">IIBBBBB", TEX, TEX, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def uv(region):
    (x, y, w, h), _ = REGIONS[region]
    s = 16 / TEX
    return [x * s, y * s, (x + w) * s, (y + h) * s]


# --- Modell ---

# name, from, to, Material (Seiten, oben, unten), Drehung (Achse, Winkel, Drehpunkt) oder None
ELEMENTS = [
    # Krempe: Mittelteil, vorne leicht nach unten, hinten leicht hoch, Seiten hochgebogen
    ("Krempe",        [-5, 14, -4],   [21, 15.5, 20],  ("side", "top", "under"), None),
    ("Krempe vorne",  [-1, 14, -8],   [17, 15.5, -4],  ("side", "top", "under"), ("x", -22.5, [8, 14.75, -4])),
    ("Krempe hinten", [-1, 14, 20],   [17, 15.5, 24],  ("side", "top", "under"), ("x", 22.5, [8, 14.75, 20])),
    ("Krempe links",  [-11, 14, -1],  [-5, 15.5, 17],  ("side", "top", "under"), ("z", -45, [-5, 14.75, 8])),
    ("Krempe rechts", [21, 14, -1],   [27, 15.5, 17],  ("side", "top", "under"), ("z", 45, [21, 14.75, 8])),
    # Krone mit Delle oben in der Mitte (von vorne nach hinten).
    # Breiter als der Kopf samt zweiter Skin-Ebene (-0.5..16.5), sonst schaut der Kopf seitlich durch.
    ("Krone",         [-0.75, 14, -0.75], [16.75, 25, 16.75], ("side", "top", "under"), None),
    ("Krone links",   [0, 25, 1],     [7.5, 27, 15],   ("side", "top", "under"), None),
    ("Krone rechts",  [8.5, 25, 1],   [16, 27, 15],    ("side", "top", "under"), None),
    ("Krone Mitte",   [7.5, 25, 2],   [8.5, 25.75, 14], ("side", "top", "under"), None),
    # Hutband mit Schnalle vorne
    ("Hutband",       [-1, 15.5, -1],     [17, 17.75, 17],   ("band", "band", "band"), None),
    ("Schnalle",      [6.5, 15.25, -1.25], [9.5, 18, -1],    ("gold", "gold", "gold"), None),
]

FACES = ["north", "east", "south", "west", "up", "down"]


def faces_for(mat, java):
    side, top, under = mat
    out = {}
    for f in FACES:
        region = top if f == "up" else under if f == "down" else side
        out[f] = {"uv": uv(region), "texture": "#0" if java else 0}
    return out


def java_model():
    elements = []
    for name, a, b, mat, rot in ELEMENTS:
        e = {"name": name, "from": a, "to": b, "faces": faces_for(mat, True)}
        if rot:
            e["rotation"] = {"angle": rot[1], "axis": rot[0], "origin": rot[2]}
        elements.append(e)
    return {
        "credit": "Cowboyhut von Nicolas Brand",
        "texture_size": [TEX, TEX],
        "textures": {"0": "item/cowboy_hat", "particle": "item/cowboy_hat"},
        "elements": elements,
        # Kopf = 16 Einheiten; Minecraft zeigt 16 Einheiten auf dem Kopf etwas groesser als den Kopf an
        "display": {
            "head": {"translation": [0, 0, 0], "scale": [0.8, 0.8, 0.8]},
            "gui": {"rotation": [25, -135, 0], "translation": [0, -2, 0], "scale": [0.45, 0.45, 0.45]},
            "ground": {"translation": [0, 2, 0], "scale": [0.3, 0.3, 0.3]},
            "fixed": {"scale": [0.5, 0.5, 0.5]},
        },
    }


def bbmodel(png):
    elements = []
    for name, a, b, mat, rot in ELEMENTS:
        r = [0, 0, 0]
        origin = rot[2] if rot else [(a[i] + b[i]) / 2 for i in range(3)]
        if rot:
            r["xyz".index(rot[0])] = rot[1]
        elements.append({
            "name": name, "box_uv": False, "rescale": False, "locked": False,
            "render_order": "default", "allow_mirror_modeling": True,
            "from": a, "to": b, "autouv": 0, "color": 0,
            "origin": origin, "rotation": r,
            "faces": faces_for(mat, False), "type": "cube", "uuid": str(uuid.uuid4()),
        })
    model = java_model()
    return {
        "meta": {"format_version": "4.10", "model_format": "java_block", "box_uv": False},
        "name": "cowboy_hat",
        "parent": "",
        "ambientocclusion": True,
        "front_gui_light": False,
        "visible_box": [1, 1, 0],
        "resolution": {"width": 16, "height": 16},
        "elements": elements,
        "outliner": [e["uuid"] for e in elements],
        "textures": [{
            "path": "", "name": "cowboy_hat.png", "folder": "item", "namespace": "", "id": "0",
            "width": TEX, "height": TEX, "uv_width": 16, "uv_height": 16,
            "particle": False, "render_mode": "default", "render_sides": "auto", "frame_time": 1,
            "visible": True, "internal": True, "saved": False, "uuid": str(uuid.uuid4()),
            "source": "data:image/png;base64," + base64.b64encode(png).decode(),
        }],
        "display": model["display"],
    }


if __name__ == "__main__":
    png = png_bytes(make_texture())
    (OUT / "cowboy_hat.png").write_bytes(png)
    (OUT / "cowboy_hat.json").write_text(json.dumps(java_model(), indent=2), encoding="utf-8")
    (OUT / "cowboyhut.bbmodel").write_text(json.dumps(bbmodel(png), indent=2), encoding="utf-8")
    print("ok:", ", ".join(p.name for p in sorted(OUT.glob("cowboy*"))))
