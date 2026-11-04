// Inhalte der Pruefungsvorbereitung "UI Designen".
// Nur hier aendern, die Seite (index.html) baut Themen, Lernkarten und Quiz daraus.
//
// themen: { titel, text, punkte: [] }
// karten: { thema, frage, antwort }
// quiz:   { thema, frage, optionen: [], richtig: Index der richtigen Option (ab 0), erklaerung }

window.INHALT = {
  titel: "UI Designen",
  untertitel: "Prüfungsvorbereitung · Modul 322",
  pruefung: "Test in Modul 322 „Benutzerschnittstellen entwerfen und implementieren“. Prüfungsinhalte folgen.",
  themen: [
    {
      titel: "Modul 322 – Handlungsziele",
      text: "Kompetenz: Benutzerschnittstellen für eine Applikation unter Berücksichtigung von Standards und ergonomischen Anforderungen entwerfen und implementieren. (Quelle: gibb-Kursbeschreibung und Schullehrplan GB Chur, offizielle Modulidentifikation auf modulbaukasten.ch noch prüfen.)",
      punkte: [
        "Merkmale der Benutzer und den Nutzungskontext für die zu lösende Aufgabe analysieren und dokumentieren.",
        "Varianten einer Benutzerschnittstelle (Bildschirm und Ablauf) auf Basis vorgegebener Standards entwerfen.",
        "Eine Benutzerschnittstelle gemäss Entwurf umsetzen und kritische Stellen auf Machbarkeit prüfen.",
        "Eine barrierefreie Benutzerschnittstelle umsetzen und überprüfen."
      ]
    }
  ],
  karten: [],
  quiz: [
    {
      thema: "Benutzerschnittstelle",
      frage: "Wobei handelt es sich um eine Benutzerschnittstelle?",
      optionen: [
        "Graphical User Interface (GUI)",
        "Voice User Interface (VUI)",
        "Command Line Interface (CLI)",
        "Tangible User Interface (TUI)"
      ],
      richtig: [0, 1, 2, 3],
      erklaerung: ""
    },
    {
      thema: "Benutzerschnittstelle",
      frage: "Wann gehört ein Element zur Benutzerschnittstelle?",
      optionen: [
        "Wenn es für die Nutzenden sichtbar oder wahrnehmbar ist",
        "Wenn es den Nutzenden grafisch auf dem Bildschirm dargestellt wird",
        "Wenn es Nutzende bei der Erledigung einer Aufgabe unterstützt",
        "Wenn es eine bestimmte Funktion des interaktiven Systems ausführt"
      ],
      richtig: 2,
      erklaerung: ""
    },
    {
      thema: "UI-Design",
      frage: "Was ist das Ziel von UI-Design?",
      optionen: [
        "Eine Benutzerschnittstelle möglichst gross zu gestalten",
        "Eine Benutzerschnittstelle möglichst schön zu gestalten",
        "Eine Benutzerschnittstelle möglichst einfach zu gestalten"
      ],
      richtig: 2,
      erklaerung: ""
    },
    {
      thema: "UX-Design",
      frage: "Was ist das Ziel von UX-Design?",
      optionen: [
        "Der App ein möglichst modernes Aussehen zu verpassen",
        "Dem Nutzer ein möglichst positives Nutzererlebnis zu bieten",
        "Dem Auftraggeber einen möglichst guten Eindruck zu vermitteln"
      ],
      richtig: 1,
      erklaerung: ""
    },
    {
      thema: "UI und UX",
      frage: "Was ist der Unterschied von UI und UX?",
      optionen: [
        "UI/UX meint dasselbe",
        "UI passiert auf dem Bildschirm",
        "UX passiert vor dem Bildschirm"
      ],
      richtig: [1, 2],
      erklaerung: ""
    },
    {
      thema: "Usability (ISO 9241)",
      frage: "Was sind die Ziele des Standards für Software-Ergonomie (ISO 9241)?",
      optionen: [
        "Einfach verständliche Software",
        "Schnell anpassbare Software",
        "Leicht benutzbare Software",
        "Günstig umsetzbare Software"
      ],
      richtig: [0, 2],
      erklaerung: ""
    },
    {
      thema: "Usability (ISO 9241)",
      frage: "Was beschreibt der Standard für Usability (ISO 9241 Teil 11)?",
      optionen: [
        "Nutzbarkeit",
        "Benutzerfreundlichkeit",
        "Gebrauchstauglichkeit"
      ],
      richtig: 2,
      erklaerung: ""
    },
    {
      thema: "Usability",
      frage: "Warum ist eine gute Usability wichtig?",
      optionen: [
        "Weil zufriedene User ein Wettbewerbsvorteil sind",
        "Weil zufriedene User eher für mein Produkt bezahlen",
        "Weil zufriedene User weniger zur Konkurrenz wechseln"
      ],
      richtig: [0, 1, 2],
      erklaerung: ""
    },
    {
      thema: "Usability",
      frage: "Welche Kriterien bestimmen eine gute Usability?",
      optionen: [
        "Freundlichkeit",
        "Zufriedenheit",
        "Effektivität",
        "Effizienz"
      ],
      richtig: [1, 2, 3],
      erklaerung: ""
    },
    {
      thema: "Usability",
      frage: "Wie kann ich die Usability messen?",
      optionen: [
        "Nutzer fragen, wie zufrieden er mit der Lösung einer bestimmten Aufgabe ist",
        "Zeit stoppen, wie lange ein Nutzer für eine bestimmte Aufgabe braucht",
        "Nutzer beobachten, ob er das Ziel einer bestimmten Aufgabe erreicht"
      ],
      richtig: [0, 1, 2],
      erklaerung: ""
    },
    {
      thema: "IT-Projekte",
      frage: "Was ist der grösste Erfolgsfaktor in IT-Projekten?",
      optionen: [
        "Unterstützung des Managements",
        "Klar formulierte Anforderungen",
        "Einbindung der Endbenutzer",
        "Saubere Planung"
      ],
      richtig: 2,
      erklaerung: ""
    },
    {
      thema: "IT-Projekte",
      frage: "Was ist der grösste Misserfolgsfaktor in IT-Projekten?",
      optionen: [
        "Fehlende Unterstützung des Managements",
        "Fehlende Einbindung der Endbenutzer",
        "Ständig wechselnde Anforderungen",
        "Unklar formulierte Anforderungen"
      ],
      richtig: 1,
      erklaerung: ""
    },
    {
      thema: "User Centered Design",
      frage: "Was trifft auf User Centered Design (UCD) zu?",
      optionen: [
        "Stellt die Nutzer in den Mittelpunkt",
        "Ist ein Gestaltungsprozess",
        "Besteht aus 4 Phasen",
        "Ist eine Methode"
      ],
      richtig: [0, 1, 2],
      erklaerung: "Im Test als falsch gewertet. Fachlich ist das umstritten: UCD wird oft als Prozess oder Ansatz beschrieben, teils auch als Methode. Das mit der Lehrperson klären."
    },
    {
      thema: "User Centered Design",
      frage: "Wobei handelt es sich um die 4 Phasen von User Centered Design?",
      optionen: [
        "Analyse, Planung, Gestaltung, Testing",
        "Information, Planung, Realisierung, Auswertung",
        "Analyse, Spezifikation, Design, Evaluation"
      ],
      richtig: 2,
      erklaerung: ""
    },
    {
      thema: "User Centered Design",
      frage: "Mit welcher Methode können Bedürfnisse von Nutzern erforscht werden?",
      optionen: [
        "User Stories",
        "User Experience",
        "User Interviews"
      ],
      richtig: 2,
      erklaerung: ""
    },
    {
      thema: "Informationsdarstellung",
      frage: "Was ist die durchschnittliche Zeit, die User auf einer Webseite verbringen?",
      optionen: [
        "5 Sekunden",
        "15 Sekunden",
        "25 Sekunden"
      ],
      richtig: 1,
      erklaerung: ""
    },
    {
      thema: "Informationsdarstellung",
      frage: "Warum ist eine gute Informationsdarstellung wichtig?",
      optionen: [
        "Damit Nutzerinnen ein UI schnell verstehen",
        "Damit sich Nutzerinnen einfach orientieren können",
        "Damit Nutzerinnen Inhalte gut unterscheiden können"
      ],
      richtig: [0, 1, 2],
      erklaerung: ""
    },
    {
      thema: "Informationsdarstellung",
      frage: "Welche Begriffe gehören zu den sechs Grundsätzen der Informationsdarstellung?",
      optionen: [
        "Entdeckbarkeit",
        "Kompaktheit",
        "Effektivität",
        "Ablenkungsfreiheit",
        "Konsistenz"
      ],
      richtig: [0, 1, 3, 4],
      erklaerung: ""
    },
    {
      thema: "Informationsdarstellung",
      frage: "Welche Zuordnung der Blickmuster ist korrekt?",
      optionen: [
        "Z-Muster bei viel Text, F-Muster bei wenig Text",
        "Z-Muster bei wenig Text, F-Muster bei viel Text",
        "Beide Muster beschreiben ausschliesslich Seiten mit viel Text",
        "Die Textmenge spielt für die Zuordnung keine Rolle"
      ],
      richtig: 1,
      erklaerung: ""
    },
    {
      thema: "Navigation",
      frage: "Welche Aussagen beschreiben eine konsistente Navigation?",
      optionen: [
        "Die Navigation erscheint auf jedem Screen immer gleich",
        "Sie bestätigt dem Nutzer immer noch auf der selben Website zu sein",
        "Sie wird auch beim Scrollen immer angezeigt",
        "Ausgewählte Menupunkte werden immer gleich hervorgehoben"
      ],
      richtig: [0, 1, 3],
      erklaerung: ""
    },
    {
      thema: "Nutzerforschung",
      frage: "Was ist Think Aloud?",
      optionen: [
        "Eine User Story zum Nachdenken",
        "Eine Hilfestellung, wenn ein User nicht mehr weiter kommt.",
        "Eine Methode in der Nutzerforschung"
      ],
      richtig: 2,
      erklaerung: ""
    },
    {
      thema: "Nutzerforschung",
      frage: "Was kann ich mit Think Aloud erreichen?",
      optionen: [
        "Gedanken erkennen",
        "Absichten erkennen",
        "Gefühle erkennen"
      ],
      richtig: [0, 1, 2],
      erklaerung: ""
    },
    {
      thema: "Nutzerforschung",
      frage: "Was ist ein Smoke Test?",
      optionen: [
        "Eine Methode um Ideen zu testen",
        "Eine Methode um eine Visualisierung zu testen",
        "Ein sehr früher Test"
      ],
      richtig: [0, 1, 2],
      erklaerung: ""
    },
    {
      thema: "Nutzerforschung",
      frage: "Was ist ein Nutzertest?",
      optionen: [
        "Eine Methode um die Usability zu prüfen",
        "Ein Test mit echten Nutzern aus der Zielgruppe",
        "Ein Test um zu prüfen wie schlau ein User ist"
      ],
      richtig: [0, 1],
      erklaerung: ""
    },
    {
      thema: "Usability-Test",
      frage: "Was wird bei einem Usability-Test gemessen?",
      optionen: [
        "Ob ein User eine bestimmte Aufgabe erledigen kann",
        "Wie lange ein User benötigt, um eine bestimmte Aufgabe zu erledigen",
        "Wie zufrieden ein User ist, nachdem er das Ziel erreicht hat"
      ],
      richtig: [0, 1, 2],
      erklaerung: ""
    },
    {
      thema: "Extreme Users",
      frage: "Was ist das Hauptziel der Arbeit mit Extreme Users im Designprozess?",
      optionen: [
        "Produkte speziell für Randgruppen zu entwickeln",
        "Möglichst viele Sonderfunktionen einzubauen",
        "Bedürfnisse sichtbar zu machen, die auch für andere Nutzer relevant sind",
        "Usability-Tests zu beschleunigen"
      ],
      richtig: 2,
      erklaerung: ""
    },
    {
      thema: "Extreme Users",
      frage: "Wobei handelt es sich um Extreme User?",
      optionen: [
        "Menschen mit Sehbeeinträchtigung",
        "Menschen unter starkem Stress",
        "Menschen, die eine App nur einmal nutzen",
        "Menschen, die eine App regelmässig nutzen"
      ],
      richtig: [0, 1],
      erklaerung: ""
    },
    {
      thema: "Barrierefreiheit",
      frage: "Was bedeutet Barrierefreiheit bei digitalen Produkten?",
      optionen: [
        "Dass ein Produkt möglichst einfach aussieht",
        "Dass ein Produkt ohne Anleitung verständlich ist",
        "Dass ein Produkt nur auf mobilen Geräten funktioniert",
        "Dass Menschen mit unterschiedlichen Fähigkeiten ein Produkt selbstständig nutzen können"
      ],
      richtig: 3,
      erklaerung: ""
    },
    {
      thema: "Barrierefreiheit",
      frage: "Welche Massnahme verbessert die Barrierefreiheit für sehbehinderte User am meisten?",
      optionen: [
        "Kleine Schrift, dafür mehr Inhalt auf dem Screen für den Screenreader",
        "Farben mit geringem Kontrast, aber modernem Look",
        "Alternativtexte (Alt-Texte) für Bilder",
        "Animationen zur besseren Orientierung"
      ],
      richtig: 2,
      erklaerung: ""
    },
    {
      thema: "Barrierefreiheit",
      frage: "Welche Aussagen zur Barrierefreiheit treffen zu?",
      optionen: [
        "Barrierefreiheit hilft auch Nutzer:innen ohne Beeinträchtigung",
        "Barrierefreiheit betrifft nur Menschen mit Behinderungen",
        "Gute Kontraste verbessern die Lesbarkeit für alle",
        "Klare Navigation unterstützt auch gestresste Nutzer"
      ],
      richtig: [0, 2, 3],
      erklaerung: ""
    },
    {
      thema: "Gestaltungsmuster",
      frage: "Was beschreibt ein Gestaltungsmuster (UI Pattern) am besten?",
      optionen: [
        "Eine kreative Einzelidee für ein einzigartiges Interface",
        "Eine bewährte Lösung für ein wiederkehrendes Designproblem",
        "Ein technisches Framework zur UI-Implementierung",
        "Ein visuelles Stilmittel (Farben, Schriften, Icons)"
      ],
      richtig: 1,
      erklaerung: ""
    },
    {
      thema: "Gestaltungsmuster",
      frage: "Welche der folgenden Elemente gelten als typische Gestaltungsmuster?",
      optionen: [
        "Breadcrumb-Navigation",
        "Button",
        "Ladeanzeiger",
        "Modaler Dialog",
        "Card"
      ],
      richtig: [0, 1, 2, 3, 4],
      erklaerung: ""
    },
    {
      thema: "Gestaltungsmuster",
      frage: "Warum helfen Gestaltungsmuster besonders bei der Usability?",
      optionen: [
        "Sie sehen moderner aus",
        "Nutzer kennen sie bereits aus anderen Anwendungen",
        "Sie reduzieren den Code-Aufwand",
        "Sie ersetzen Usability-Tests"
      ],
      richtig: 1,
      erklaerung: ""
    },
    {
      thema: "Gestaltungsmuster",
      frage: "Welche Aussagen zu Gestaltungsmustern sind korrekt?",
      optionen: [
        "Sie fördern Konsistenz innerhalb und zwischen Produkten",
        "Sie machen Interfaces intuitiver",
        "Sie schränken Designer grundsätzlich kreativ ein",
        "Sie reduzieren typische Bedienfehler",
        "Sie sind nur für Mobile Apps relevant"
      ],
      richtig: [0, 1, 3],
      erklaerung: ""
    },
    {
      thema: "Dark Patterns",
      frage: "Was unterscheidet ein Dark Pattern von einem normalen Gestaltungsmuster?",
      optionen: [
        "Dark Patterns sind technisch schlechter umgesetzt",
        "Dark Patterns manipulieren Nutzer absichtlich",
        "Dark Patterns sind nur im E-Commerce erlaubt",
        "Dark Patterns widersprechen Usability-Prinzipien"
      ],
      richtig: [1, 3],
      erklaerung: ""
    }
  ]
};
