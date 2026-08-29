import { useHotkeys } from "@tanstack/react-hotkeys";
import { HOTKEYS, overlayOpen } from "@/lib/hotkeys";

type DrawHotkeys = {
  canControl: boolean;
  pending: boolean;
  hasPlayer: boolean;
  drawnCount: number;
  canUndo: boolean;
  cooldownActive: boolean;
  poolEmpty: boolean;
  rolesLocked: boolean;
  role: string;
  onDraw: () => void;
  onSkip: () => void;
  onPauseResume: () => void;
  onUndo: () => void;
  onRestart: () => void;
  onClearRole: () => void;
};

export function useDrawHotkeys({
  canControl,
  pending,
  hasPlayer,
  drawnCount,
  canUndo,
  cooldownActive,
  poolEmpty,
  rolesLocked,
  role,
  onDraw,
  onSkip,
  onPauseResume,
  onUndo,
  onRestart,
  onClearRole,
}: DrawHotkeys) {
  useHotkeys(
    [
      {
        hotkey: HOTKEYS.drawOrSkip,
        callback: () => {
          if (overlayOpen() || pending || poolEmpty) return;
          if (hasPlayer) {
            onSkip();
            return;
          }
          if (cooldownActive) return;
          onDraw();
        },
        options: { meta: { name: "Estrai o salta" } },
      },
      {
        hotkey: HOTKEYS.pause,
        callback: () => {
          if (overlayOpen() || pending || !hasPlayer || !cooldownActive) return;
          onPauseResume();
        },
        options: { meta: { name: "Pausa" } },
      },
      {
        hotkey: HOTKEYS.undo,
        callback: () => {
          if (overlayOpen() || pending || !canUndo) return;
          onUndo();
        },
        options: { meta: { name: "Annulla ultimo" } },
      },
      {
        hotkey: HOTKEYS.restart,
        callback: () => {
          if (overlayOpen() || pending || drawnCount === 0) return;
          onRestart();
        },
        options: { meta: { name: "Nuova estrazione" } },
      },
      {
        hotkey: HOTKEYS.clearRole,
        callback: () => {
          if (overlayOpen() || rolesLocked || !role) return;
          onClearRole();
        },
        options: {
          preventDefault: false,
          meta: { name: "Togli ruolo" },
        },
      },
    ],
    { enabled: canControl, ignoreInputs: true, requireReset: true },
  );
}
