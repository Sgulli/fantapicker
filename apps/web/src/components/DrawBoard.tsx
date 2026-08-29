import type { ReactNode } from "react";
import {
  CircleAlertIcon,
  DicesIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipForwardIcon,
  Undo2Icon,
} from "lucide-react";
import type { Player, RoleCount } from "@fantapicker/shared";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@fantapicker/ui/components/alert";
import { Button } from "@fantapicker/ui/components/button";
import { ConfirmDialog } from "@fantapicker/ui/components/confirm-dialog";
import { Skeleton } from "@fantapicker/ui/components/skeleton";
import { Spinner } from "@fantapicker/ui/components/spinner";
import { DrawStage } from "@/components/DrawStage";
import { DrawnList } from "@/components/DrawnList";
import { PlayerCard } from "@/components/PlayerCard";
import { RoleSelector } from "@/components/RoleSelector";

export type DrawCooldownView = {
  active: boolean;
  paused: boolean;
  remainingSec: number;
  progress: number;
};

type DrawBoardProps = {
  role: string;
  liveRoles: RoleCount[];
  onRoleChange: (role: string) => void;
  rolesLocked: boolean;
  pending: boolean;
  player: Player | null;
  drawn: Player[];
  canUndo: boolean;
  cooldown: DrawCooldownView;
  poolEmpty: boolean;
  roleExhausted: boolean;
  deckExhausted: boolean;
  canControl: boolean;
  onDraw: () => void;
  onSkip: () => void;
  onPauseResume: () => void;
  onUndo: () => void;
  onReset: () => void;
  onRestartOpenChange?: (open: boolean) => void;
  header?: ReactNode;
};

export function DrawBoard({
  role,
  liveRoles,
  onRoleChange,
  rolesLocked,
  pending,
  player,
  drawn,
  canUndo,
  cooldown,
  poolEmpty,
  roleExhausted,
  deckExhausted,
  canControl,
  onDraw,
  onSkip,
  onPauseResume,
  onUndo,
  onReset,
  onRestartOpenChange,
  header,
}: DrawBoardProps) {
  return (
    <div className="flex w-full flex-col items-center gap-6 sm:gap-8">
      <div className="flex w-full max-w-lg flex-col items-center gap-3 text-center">
        <h1 className="text-balance text-3xl sm:text-4xl">Estrai un giocatore</h1>
        <p className="text-muted-foreground text-pretty text-sm leading-relaxed sm:text-base">
          {role
            ? "Tocca un ruolo Mantra e estrai. I FVM alti escono più spesso: i fondi lista restano in gioco."
            : "Nessun ruolo: estrazione random su tutto il listone. Tocca un ruolo per filtrare."}
        </p>
      </div>
      {header}
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-card/40 p-3 backdrop-blur-sm sm:p-4">
        <p className="text-muted-foreground mb-3 text-center text-xs tracking-[0.2em] uppercase">
          Ruolo
        </p>
        <RoleSelector
          roles={liveRoles}
          value={role}
          onChange={onRoleChange}
          locked={rolesLocked || !canControl}
        />
      </div>
      <div className="flex w-full max-w-sm flex-col items-stretch gap-2">
        <Button
          size="lg"
          className="shadow-glow min-h-11 w-full px-6"
          disabled={!canControl || pending || cooldown.active || poolEmpty}
          onClick={onDraw}
        >
          {pending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <DicesIcon data-icon="inline-start" />
          )}
          {pending
            ? "Estrazione…"
            : deckExhausted
              ? "Mazzo esaurito"
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
        {canControl && player ? (
          <div className="grid min-h-11 grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending || poolEmpty}
              onClick={onSkip}
            >
              <SkipForwardIcon data-icon="inline-start" />
              Salta
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending || !cooldown.active}
              onClick={onPauseResume}
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
        {canControl && drawn.length > 0 ? (
          <div className="grid min-h-11 grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending || !canUndo}
              onClick={onUndo}
            >
              <Undo2Icon data-icon="inline-start" />
              Annulla ultimo
            </Button>
            <ConfirmDialog
              title="Sei sicuro di riavviare?"
              description="L'estrazione in corso si azzera. I giocatori già usciti tornano nel mazzo."
              onOpenChange={onRestartOpenChange}
              onConfirm={onReset}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={pending}
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  Nuova estrazione
                </Button>
              }
            />
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
      <DrawnList drawn={drawn} />
    </div>
  );
}
