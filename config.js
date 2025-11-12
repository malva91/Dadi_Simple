window.APP_CONFIG = {
    ROOM_NAME: "Matteo Poropat",                 // string
    COLOR_PALETTE: [
        '#8B3A3A', // dark red
        '#3A3A8B', // dark blue
        '#3A8B3A', // dark green
        '#8B8B3A', // dark yellow
        '#8B5A3A', // dark orange
        '#6B3A6B', // dark purple
        '#3A8B8B', // dark cyan
        '#8B3A5A', // dark pink
        '#5A5A5A', // dark gray
        '#704040', // dark brown
        '#8B4040', // darker red
        '#408B40', // darker green
        '#40408B', // darker blue
        '#8B408B', // darker magenta
        '#608060', // darker olive
        '#806080', // darker lavender
        '#608080', // darker teal
        '#805050', // darker rust
        '#505080', // darker slate
        '#805060'  // darker mauve
    ],
    DICE_SIDES: [4, 6, 8, 10, 12, 20, 100],     // array di interi
    DICE_COLORS: [
        { value: "base", label: "Base", emoji: "" },
        { value: "rosso", label: "Rosso", emoji: "🔴" },
        { value: "blu", label: "Blu", emoji: "🔵" },
        { value: "verde", label: "Verde", emoji: "🟢" },
        { value: "giallo", label: "Giallo", emoji: "🟡" },
        { value: "viola", label: "Viola", emoji: "🟣" },
        { value: "nero", label: "Nero", emoji: "⚫" },
        { value: "bianco", label: "Bianco", emoji: "⚪" },
        { value: "attacco", label: "Attacco", emoji: "🗡️" },
        { value: "difesa", label: "Difesa", emoji: "🛡️" },
        { value: "magia", label: "Magia", emoji: "✨" },
        { value: "cura", label: "Cura", emoji: "💊" }

    ],

    CUSTOM_DICE_TYPES: {
"rune": {
  label: "Rune",
  emoji: "🔮",
  displayName: "Runa",
  values: [
    "ᚠ Fehu",       // ricchezza, abbondanza
    "ᚢ Uruz",       // forza vitale, potenza
    "ᚦ Thurisaz",   // difesa, conflitto, gigante
    "ᚨ Ansuz",      // comunicazione, ispirazione
    "ᚱ Raido",      // viaggio, cammino, destino
    "ᚲ Kenaz",      // fuoco, conoscenza, creatività
    "ᚷ Gebo",       // dono, alleanza, scambio
    "ᚹ Wunjo",      // gioia, armonia
    "ᚺ Hagalaz",    // tempesta, cambiamento improvviso
    "ᚾ Nauthiz",    // necessità, prova, resistenza
    "ᛁ Isa",        // ghiaccio, pausa, controllo
    "ᛃ Jera",       // raccolto, ciclo, ricompensa
    "ᛇ Eihwaz",     // protezione, equilibrio, trasformazione
    "ᛈ Perthro",    // mistero, sorte, destino occulto
    "ᛉ Algiz",      // protezione spirituale
    "ᛋ Sowilo",     // sole, vittoria, successo
    "ᛏ Tiwaz",      // giustizia, onore, sacrificio
    "ᛒ Berkano",    // rinascita, crescita, femminilità
    "ᛖ Ehwaz",      // fiducia, cooperazione
    "ᛗ Mannaz",     // umanità, intelligenza, comunità
    "ᛚ Laguz",      // acqua, intuizione, flusso
    "ᛜ Ingwaz",     // fertilità, completamento
    "ᛞ Dagaz",      // alba, rivelazione, trasformazione
    "ᛟ Othala"      // eredità, casa, radici
  ]
},
"Moneta": {
  label: "Moneta",
  emoji: "🪙",
  displayName: "Moneta",
  values: [
    "🪙 Testa",
    "🦅 Croce"
  ]
},
"Vero/Falso": {
  label: "Vero/Falso",
  emoji: "⚖️",
  displayName: "Vero/Falso",
  values: [
    "✅ Vero",
    "❌ Falso"
  ]
},
"Bestemmie": {
  label: "Bestemmie",
  emoji: "😈",
  displayName: "Bestemmia",
  values: [
    "Dio Cinghiale 🐗",
    "Dio Lupo 🐺",
    "Dio Falco 🦅",
    "Dio Serpente lurido 🐍",
    "Dio Grifone bstardo 🦁🦅",
    "Dio Cane 🐶",
    "Dio Cavallo al galoppo 🐴",
    "Dio Gufo 🦉",
    "Dio verme 🪱",
    "Dio maiale 🐷",
    "Madonna Lepre 🐇",
    "Madonna Gatta 🐈",
    "Madonna Volpe 🦊",
    "Madonna Cerva 🦌",
    "Madonna Civetta 🦉",
    "Madonna Cane 🐶",
    "Madonna Oca 🦢",
    "Madonna a Pecora 🐑",
    "Madonna Cinghiale 🐗",
    "Madonna Lupa 🐺",
    "Madonna Maiala 🐷"
  ]
},
    }
};
