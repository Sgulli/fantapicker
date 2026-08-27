import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  CircleAlertIcon,
  DicesIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipForwardIcon,
  Undo2Icon,
  UploadIcon,
} from "lucide-react";
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
import { Spinner } from "@fantapicker/ui/components/spinner";
import { DrawStage } from "@/components/DrawStage";
import { PlayerCard } from "@/components/PlayerCard";
import { RoleSelector } from "@/components/RoleSelector";
import { useDrawCooldown } from "@/hooks/useDrawCooldown";
import { useDrawSession, type DrawOutcome } from "@/hooks/useDrawSession";

const DRAW_COOLDOWN_MS = 5000;
const HISTORY_VISIBLE = 8;

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
    deckExhausted,
    noMantraRoles,
    canUndo,
    draw,
    undoLast,
    newExtraction,
  } = useDrawSession();
  const startRef = useRef(() => {});
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
  const history = [...drawn].reverse().slice(0, HISTORY_VISIBLE);

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
    <div className="flex w-full flex-col items-center gap-6 sm:gap-8">
      <div className="flex w-full max-w-lg flex-col items-center gap-3 text-center">
        <h1 className="text-balance text-3xl sm:text-4xl">Estrai un giocatore</h1>
        <p className="text-muted-foreground text-pretty text-sm leading-relaxed sm:text-base">
          Tocca un ruolo Mantra e estrai. I FVM alti escono più spesso: i fondi
          lista restano in gioco.
        </p>
      </div>
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-card/40 p-3 backdrop-blur-sm sm:p-4">
        <p className="text-muted-foreground mb-3 text-center text-xs tracking-[0.2em] uppercase">
          Ruolo
        </p>
        <RoleSelector
          roles={liveRoles}
          value={role}
          onChange={setRole}
          locked={rolesLocked}
        />
      </div>
      <div className="flex w-full max-w-sm flex-col items-stretch gap-2">
        <Button
          size="lg"
          className="shadow-glow min-h-11 w-full px-6"
          disabled={!role || pending || cooldown.active || roleExhausted}
          onClick={() => void drawFromUser()}
        >
          {pending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <DicesIcon data-icon="inline-start" />
          )}
          {pending
            ? "Estrazione…"
            : roleExhausted
              ? "Ruolo esaurito"
              : cooldown.paused
                ? "In pausa"
                : cooldown.active
                  ? `Prossimo tra ${cooldown.remainingSec}s`
                  : "Estrai"}
        </Button>
        <div
          className="bg-muted h-1 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          <div
            className="bg-primary h-full origin-left transition-transform duration-100 ease-linear"
            style={{
              transform: `scaleX(${player ? cooldown.progress : 0})`,
            }}
          />
        </div>
        {player ? (
          <div className="grid min-h-11 grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending || roleExhausted}
              onClick={() => void skipWait()}
            >
              <SkipForwardIcon data-icon="inline-start" />
              Salta
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending || !cooldown.active}
              onClick={pauseOrResume}
            >
              {cooldown.paused ? (
                <PlayIcon data-icon="inline-start" />
              ) : (
                <PauseIcon data-icon="inline-start" />
              )}
              {cooldown.paused ? "Riprendi" : "Pausa"}
            </Button>
          </div>
        ) : null}
        {drawn.length > 0 ? (
          <div className="grid min-h-11 grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending || !canUndo}
              onClick={() => {
                cooldown.clear();
                undoLast();
              }}
            >
              <Undo2Icon data-icon="inline-start" />
              Annulla ultimo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => {
                cooldown.clear();
                newExtraction();
              }}
            >
              <RotateCcwIcon data-icon="inline-start" />
              Nuova estrazione
            </Button>
          </div>
        ) : null}
      </div>
      {deckExhausted ? (
        <Alert className="w-full max-w-sm">
          <CircleAlertIcon />
          <AlertTitle>Mazzo esaurito</AlertTitle>
          <AlertDescription>
            Tutti i giocatori sono già usciti. Annulla l&apos;ultimo o inizia una
            nuova estrazione.
          </AlertDescription>
        </Alert>
      ) : roleExhausted ? (
        <Alert className="w-full max-w-sm">
          <CircleAlertIcon />
          <AlertTitle>Ruolo esaurito</AlertTitle>
          <AlertDescription>
            Tutti i giocatori di questo ruolo sono già usciti. Tocca un altro
            ruolo per continuare, oppure nuova estrazione.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex w-full max-w-sm justify-center" aria-live="polite">
        {pending && !player ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : null}
        {player ? (
          <DrawStage drawKey={String(player.playerId)}>
            <PlayerCard player={player} />
          </DrawStage>
        ) : null}
      </div>
      {history.length > 0 ? (
        <div className="flex w-full max-w-sm flex-col gap-2">
          <p className="text-muted-foreground text-center text-xs tracking-[0.2em] uppercase">
            Estratti ({drawn.length})
          </p>
          <ol className="flex flex-col gap-1">
            {history.map((item) => (
              <li
                key={item.playerId}
                className="text-foreground/90 truncate text-sm"
              >
                {item.name}
              </li>
            ))}
          </ol>
          {drawn.length > HISTORY_VISIBLE ? (
            <p className="text-muted-foreground text-center text-xs">
              +{drawn.length - HISTORY_VISIBLE} altri
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
