export const HOTKEYS = {
  drawOrSkip: "Space",
  pause: "P",
  undo: "Mod+Z",
  restart: "Shift+N",
  clearRole: "Escape",
  help: "Mod+/",
  toggleDrawn: "L",
  drawnPrev: "[",
  drawnNext: "]",
} as const;

export const HOTKEY_HELP: {
  hotkey: string;
  action: string;
  group: string;
}[] = [
  { hotkey: HOTKEYS.drawOrSkip, action: "Estrai, o salta il countdown", group: "Estrazione" },
  { hotkey: HOTKEYS.pause, action: "Pausa o riprendi", group: "Estrazione" },
  { hotkey: HOTKEYS.undo, action: "Annulla l'ultimo estratto", group: "Estrazione" },
  { hotkey: HOTKEYS.restart, action: "Nuova estrazione (chiede conferma)", group: "Estrazione" },
  { hotkey: HOTKEYS.clearRole, action: "Togli il ruolo (random sul listone)", group: "Estrazione" },
  { hotkey: HOTKEYS.toggleDrawn, action: "Apri o chiudi la lista estratti", group: "Lista" },
  { hotkey: HOTKEYS.drawnPrev, action: "Pagina precedente", group: "Lista" },
  { hotkey: HOTKEYS.drawnNext, action: "Pagina successiva", group: "Lista" },
  { hotkey: HOTKEYS.help, action: "Mostra o nascondi le scorciatoie", group: "App" },
];

export function overlayOpen() {
  return Boolean(
    document.querySelector(
      '[data-slot="dialog-content"], [data-slot="alert-dialog-content"]',
    ),
  );
}
