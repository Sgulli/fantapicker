import { useRef } from "react";

export function usePauseForRestart(
  cooldown: { active: boolean; paused: boolean },
  pause: () => void,
  resume: () => void,
  enabled = true,
) {
  const heldRef = useRef(false);

  function onOpenChange(open: boolean) {
    if (!enabled) return;
    if (open) {
      if (!cooldown.active || cooldown.paused) return;
      pause();
      heldRef.current = true;
      return;
    }
    if (!heldRef.current) return;
    heldRef.current = false;
    resume();
  }

  function forget() {
    heldRef.current = false;
  }

  return { onOpenChange, forget };
}
