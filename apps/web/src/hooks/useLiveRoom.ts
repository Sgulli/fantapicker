import { useCallback, useEffect, useRef, useState } from "react";
import {
  DRAW_COOLDOWN_MS,
  ROOM_POLL_MS,
  drawPool,
  remainingMs,
  type RoomCommand,
  type RoomSnapshot,
  type StatsResponse,
} from "@fantapicker/shared";
import { toast } from "@fantapicker/ui/components/sonner";
import { getRoom, getStats, isAbortError, roomCommand } from "@/lib/api";
import { loadHostToken } from "@/lib/host-token";

export function useLiveRoom(code: string) {
  const hostToken = loadHostToken(code);
  const isHost = Boolean(hostToken);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const snapshotRef = useRef(snapshot);
  const pendingRef = useRef(false);
  snapshotRef.current = snapshot;

  const applySnapshot = useCallback((next: RoomSnapshot) => {
    const current = snapshotRef.current;
    if (current && next.version < current.version) return;
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const send = useCallback(
    async (command: RoomCommand) => {
      if (!hostToken || pendingRef.current) return;
      pendingRef.current = true;
      setPending(true);
      try {
        applySnapshot(await roomCommand(code, hostToken, command));
      } catch (caught) {
        if (!isAbortError(caught)) {
          toast.error(
            caught instanceof Error ? caught.message : "Comando fallito",
          );
        }
      } finally {
        pendingRef.current = false;
        setPending(false);
      }
    },
    [applySnapshot, code, hostToken],
  );

  useEffect(() => {
    const controller = new AbortController();
    void getStats(controller.signal)
      .then(setStats)
      .catch((caught) => {
        if (!isAbortError(caught)) {
          setError(caught instanceof Error ? caught.message : "Errore stats");
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      if (document.hidden) return;
      try {
        const next = await getRoom(code);
        if (!cancelled) {
          setError(null);
          applySnapshot(next);
        }
      } catch (caught) {
        if (cancelled || isAbortError(caught)) return;
        setError(caught instanceof Error ? caught.message : "Stanza non trovata");
      }
    }
    void pull();
    const id = window.setInterval(() => void pull(), ROOM_POLL_MS);
    const onVis = () => {
      if (!document.hidden) void pull();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [applySnapshot, code]);

  const remaining = remainingMs(
    snapshot?.cooldownEndsAt ?? null,
    snapshot?.paused ? snapshot.pausedMs : null,
    now,
  );
  const cooldownActive = Boolean(
    snapshot && (snapshot.paused || snapshot.cooldownEndsAt != null),
  );

  useEffect(() => {
    if (!cooldownActive) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [cooldownActive]);

  const firedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isHost || !snapshot || snapshot.paused || snapshot.cooldownEndsAt == null) {
      return;
    }
    const endsAt = snapshot.cooldownEndsAt;
    const wait = Math.max(0, endsAt - Date.now());
    const id = window.setTimeout(() => {
      if (firedAtRef.current === endsAt) return;
      firedAtRef.current = endsAt;
      void send({ type: "draw" });
    }, wait);
    return () => window.clearTimeout(id);
  }, [isHost, send, snapshot]);

  const drawn = snapshot?.players ?? [];
  const pool = drawPool(stats, {
    role: snapshot?.role ?? "",
    drawnCount: snapshot?.drawn.length ?? 0,
    drawnPlayers: drawn,
    exhaustedRoles: snapshot?.exhaustedRoles ?? [],
  });
  const role = snapshot?.role ?? "";

  return {
    stats,
    snapshot,
    error,
    pending,
    isHost,
    role,
    setRole: (next: string) => void send({ type: "setRole", role: next }),
    drawn,
    player: drawn.at(-1) ?? null,
    pool,
    canUndo: (snapshot?.drawn.length ?? 0) >= 2,
    cooldown: {
      active: cooldownActive,
      paused: Boolean(snapshot?.paused),
      remainingSec: remaining > 0 ? Math.ceil(remaining / 1000) : 0,
      progress: DRAW_COOLDOWN_MS <= 0 ? 0 : remaining / DRAW_COOLDOWN_MS,
    },
    draw: () => void send({ type: "draw" }),
    skip: () => void send({ type: "draw" }),
    pause: () => void send({ type: "pause" }),
    resume: () => void send({ type: "resume" }),
    undo: () => void send({ type: "undo" }),
    reset: () => void send({ type: "reset" }),
  };
}
