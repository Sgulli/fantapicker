import { useRef } from "react";
import { Link } from "react-router-dom";
import { CircleAlertIcon, UploadIcon } from "lucide-react";
import { DRAW_COOLDOWN_MS } from "@fantapicker/shared";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@fantapicker/ui/components/alert";
import { Button } from "@fantapicker/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@fantapicker/ui/components/empty";
import { Skeleton } from "@fantapicker/ui/components/skeleton";
import { DrawBoard } from "@/components/DrawBoard";
import { useDrawCooldown } from "@/hooks/useDrawCooldown";
import { useDrawSession, type DrawOutcome } from "@/hooks/useDrawSession";

export function PickerPage() {
  const {
    stats,
    statsError,
    loadStats,
    pending,
    role,
    setRole,
    drawn,
    player,
    liveRoles,
    roleExhausted,
    remainingDeck,
    deckExhausted,
    noMantraRoles,
    canUndo,
    draw,
    undoLast,
    newExtraction,
  } = useDrawSession();
  const startRef = useRef(() => {});
  const pausedByRestartRef = useRef(false);
  const cooldown = useDrawCooldown(DRAW_COOLDOWN_MS, () => {
    void draw().then((outcome) => {
      if (outcome === "ok") startRef.current();
    });
  });
  startRef.current = cooldown.start;

  function handleOutcome(outcome: DrawOutcome) {
    switch (outcome) {
      case "ok":
        cooldown.start();
        return;
      case "exhausted":
        cooldown.clear();
        return;
      case "fail":
        return;
      default: {
        const _never: never = outcome;
        return _never;
      }
    }
  }

  async function drawFromUser() {
    if (cooldown.active || pending) return;
    handleOutcome(await draw());
  }

  async function skipWait() {
    if (pending) return;
    cooldown.clear();
    handleOutcome(await draw());
  }

  function pauseOrResume() {
    if (cooldown.paused) cooldown.resume();
    else cooldown.pause();
  }

  function handleRestartOpenChange(open: boolean) {
    if (open) {
      if (!cooldown.active || cooldown.paused) return;
      cooldown.pause();
      pausedByRestartRef.current = true;
      return;
    }
    if (!pausedByRestartRef.current) return;
    pausedByRestartRef.current = false;
    cooldown.resume();
  }

  if (!stats && !statsError) {
    return <Skeleton className="mx-auto h-80 w-full max-w-sm" />;
  }

  if (statsError && !stats) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <Alert>
          <CircleAlertIcon />
          <AlertTitle>Listone non disponibile</AlertTitle>
          <AlertDescription>
            {statsError}. Controlla la connessione e riprova.
          </AlertDescription>
        </Alert>
        <Button
          type="button"
          className="min-h-11 w-full"
          onClick={() => void loadStats()}
        >
          Riprova
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const rolesLocked = pending || (cooldown.active && !cooldown.paused);
  const poolEmpty = role ? roleExhausted : remainingDeck <= 0;

  if (stats.playerCount === 0) {
    return (
      <Empty className="border border-white/10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UploadIcon />
          </EmptyMedia>
          <EmptyTitle className="text-xl">Nessun listone</EmptyTitle>
          <EmptyDescription>
            Carica il file Excel delle quotazioni per iniziare a estrarre.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild className="min-h-11">
            <Link to="/import">Vai all&apos;import</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (noMantraRoles) {
    return (
      <Empty className="border border-white/10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlertIcon />
          </EmptyMedia>
          <EmptyTitle className="text-xl">Nessun ruolo Mantra</EmptyTitle>
          <EmptyDescription>
            Il listone è stato importato ma non contiene ruoli Mantra. Controlla
            il file e importa di nuovo.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild className="min-h-11">
            <Link to="/import">Vai all&apos;import</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <DrawBoard
      role={role}
      liveRoles={liveRoles}
      onRoleChange={setRole}
      rolesLocked={rolesLocked}
      pending={pending}
      player={player}
      drawn={drawn}
      canUndo={canUndo}
      cooldown={cooldown}
      poolEmpty={poolEmpty}
      roleExhausted={roleExhausted}
      deckExhausted={deckExhausted}
      canControl
      onDraw={() => void drawFromUser()}
      onSkip={() => void skipWait()}
      onPauseResume={pauseOrResume}
      onUndo={() => {
        cooldown.clear();
        undoLast();
      }}
      onReset={() => {
        pausedByRestartRef.current = false;
        cooldown.clear();
        newExtraction();
      }}
      onRestartOpenChange={handleRestartOpenChange}
    />
  );
}
