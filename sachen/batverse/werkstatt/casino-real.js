// Realistisches Casino in der Werkstatt (Nicolas 2026-11-18, N31: "Neues, realistisches Casino in der Werkstatt nach Recherche echter Casinos (Groesse, Aufteilung, Aussehen)").
// Klassisches Skript nach gotham-shim.js (dkAdd, gates), spielautomat-modell.js, ../js/ui/casino-spiele.js und bankautomat.js. Halle 64 x 44 m, 5,5 m hoch, Mitte bei x 0 / z 240,
// Eingang vorne (-z, zur Strecke). Aufteilung nach typischen Merkmalen echter Casinos (Wissensstand, nicht nachrecherchiert): Eingang mit Sicherheitspult und Bankautomaten;
// Automatenfeld auf ca. zwei Dritteln der Flaeche in Reihen (links und rechts); Tischspiel-Bereich ("Pit") in der Mitte um ein Aufsichtspult (Roulette, Blackjack, Craps, Baccarat);
// abgetrennter High-Limit-Raum mit Glaswand; Kasse ("Cage") hinten in der Mitte (man geht durch den Saal); Bar hinten links, kleine Buehne davor; Toiletten vorne rechts;
// keine Fenster und Uhren, gemusterter Teppich, niedrige Decke mit vielen Einbauleuchten, Kronleuchter ueber dem Pit, Kamerakuppeln ("eye in the sky").
// Die Decke ist nur von innen sichtbar (von oben schaut man hinein). Kollision ueber dkAdd (Waende, Tische, Theken, Automatenreihen), Rechtsklick-Ziele ueber gates.
// Seit 2026-11-23 gebaut von ../js/gotham/casino-v2.js (gemeinsam mit dem Spiel), hier nur aufgestellt.
const CASINO2 = { x: 0, z: 240, y: 0, rot: 0, W: 58, D: 44, H: 5.5, g: null };
buildCasino2(CASINO2);
function casino2Zeigen() { if (modus !== "orbit") setModus("orbit"); const C = CASINO2; controls.target.set(C.x, 1, C.z); camera.position.set(C.x + 18, 34, C.z - 40); controls.update();
  if (typeof $info !== "undefined") $info.innerHTML = "<table><tr><td>Gebäude</td><td>Casino (realistisch)</td></tr><tr><td>Halle</td><td>58 x 44 m, 5,5 m hoch</td></tr></table><div class=\"note\">Automatenfeld, Pit mit Roulette, Blackjack, Craps, High-Limit-Raum, Kasse, Bar, Toiletten. Mit 4 Person hineingehen (Eingang vorne).</div>"; }
