import { useState } from "react";
import { formatForDisplay, useHotkey } from "@tanstack/react-hotkeys";
import { KeyboardIcon } from "lucide-react";
import { Button } from "@fantapicker/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@fantapicker/ui/components/dialog";
import { Kbd } from "@fantapicker/ui/components/kbd";
import { HOTKEY_HELP, HOTKEYS } from "@/lib/hotkeys";

export function HotkeyHelp() {
  const [open, setOpen] = useState(false);
  useHotkey(HOTKEYS.help, () => setOpen((value) => !value), {
    requireReset: true,
    ignoreInputs: true,
    meta: { name: "Scorciatoie" },
  });

  const groups = [...new Set(HOTKEY_HELP.map((row) => row.group))];

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11"
        aria-label="Scorciatoie da tastiera"
        onClick={() => setOpen(true)}
      >
        <KeyboardIcon />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scorciatoie</DialogTitle>
            <DialogDescription>
              Durante l&apos;estrazione valgono solo se comandi tu (picker o
              host della stanza). Non partono mentre scrivi in un campo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[min(24rem,70dvh)] flex-col gap-4 overflow-y-auto">
            {groups.map((group) => (
              <section key={group} className="flex flex-col gap-2">
                <h3 className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                  {group}
                </h3>
                <ul className="flex flex-col gap-2">
                  {HOTKEY_HELP.filter((row) => row.group === group).map(
                    (row) => (
                      <li
                        key={row.hotkey}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-sm">{row.action}</span>
                        <Kbd>{formatForDisplay(row.hotkey)}</Kbd>
                      </li>
                    ),
                  )}
                </ul>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
