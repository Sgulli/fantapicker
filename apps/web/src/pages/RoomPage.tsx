import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CircleAlertIcon } from "lucide-react";
import { isRoomCode, normalizeRoomCode } from "@fantapicker/shared";
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
import { RoomInvite } from "@/components/RoomInvite";
import { useLiveRoom } from "@/hooks/useLiveRoom";
import { usePauseForRestart } from "@/hooks/usePauseForRestart";

export function RoomPage() {
  const { code: rawCode } = useParams();
  const created = Boolean(
    (useLocation().state as { created?: boolean } | null)?.created,
  );
  const code = normalizeRoomCode(rawCode ?? "");
  if (!isRoomCode(code)) {
    return (
      <Empty className="border border-white/10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlertIcon />
          </EmptyMedia>
          <EmptyTitle className="text-xl">Stanza non trovata</EmptyTitle>
          <EmptyDescription>Il codice non è valido.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild className="min-h-11">
            <Link to="/live">Torna alle stanze</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }
  return <RoomBody code={code} created={created} />;
}

function RoomBody({ code, created }: { code: string; created: boolean }) {
  const room = useLiveRoom(code);
  const [inviteHidden, setInviteHidden] = useState(false);
  const restartPause = usePauseForRestart(
    room.cooldown,
    room.pause,
    room.resume,
    room.isHost,
  );
  const joinUrl =
    typeof window === "undefined"
      ? `/s/${code}`
      : `${window.location.origin}/s/${code}`;
  const hideInvite = inviteHidden || (room.snapshot?.drawn.length ?? 0) > 0;

  if (room.error && !room.snapshot) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <Alert>
          <CircleAlertIcon />
          <AlertTitle>Stanza non disponibile</AlertTitle>
          <AlertDescription>{room.error}</AlertDescription>
        </Alert>
        <Button asChild className="min-h-11 w-full">
          <Link to="/live">Torna alle stanze</Link>
        </Button>
      </div>
    );
  }

  if (!room.snapshot || !room.stats) {
    return <Skeleton className="mx-auto h-80 w-full max-w-sm" />;
  }

  return (
    <DrawBoard
      role={room.role}
      pool={room.pool}
      onRoleChange={room.setRole}
      pending={room.pending}
      player={room.player}
      drawn={room.drawn}
      canUndo={room.canUndo}
      cooldown={room.cooldown}
      canControl={room.isHost}
      onDraw={() => {
        setInviteHidden(true);
        room.draw();
      }}
      onSkip={room.skip}
      onPauseResume={() => {
        if (room.cooldown.paused) room.resume();
        else room.pause();
      }}
      onUndo={room.undo}
      onReset={() => {
        restartPause.forget();
        setInviteHidden(false);
        room.reset();
      }}
      onRestartOpenChange={restartPause.onOpenChange}
      header={
        hideInvite ? null : room.isHost ? (
          <RoomInvite code={code} joinUrl={joinUrl} defaultOpen={created} />
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            Stanza {code} · stai guardando l&apos;estrazione
          </p>
        )
      }
    />
  );
}
