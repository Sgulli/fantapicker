import { useCallback, useEffect, useRef, useState } from "react";
import {
  ROLE_EXHAUSTED_ERROR,
  appendDrawn,
  emptyDrawSession,
  exhaustRole,
  remainingForRole,
  remainingRoleCounts,
  resetDrawn,
  sessionPlayer,
  undoDrawn,
  type DrawSessionState,
  type StatsResponse,
} from "@fantapicker/shared";
import { toast } from "@fantapicker/ui/components/sonner";
import { getStats, isAbortError, pickPlayer } from "@/lib/api";
import {
  clearDrawSession,
  loadDrawSession,
  saveDrawSession,
} from "@/lib/session";

export type DrawOutcome = "ok" | "exhausted" | "fail";

export function useDrawSession() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [session, setSession] = useState<DrawSessionState>(emptyDrawSession());
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const sessionRef = useRef(session);
  const statsRef = useRef(stats);
  const pendingRef = useRef(false);
  const pickAbortRef = useRef<AbortController | null>(null);
  const restoredRef = useRef(false);
  sessionRef.current = session;
  statsRef.current = stats;

  const commit = useCallback((next: DrawSessionState) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const draw = useCallback(async (): Promise<DrawOutcome> => {
    const current = sessionRef.current;
    if (!current.role || pendingRef.current) return "fail";
    pendingRef.current = true;
    setPending(true);
    const controller = new AbortController();
    pickAbortRef.current = controller;
    try {
      const result = await pickPlayer(
        current.role,
        current.drawn.map((item) => item.playerId),
        controller.signal,
      );
      const next = appendDrawn(current, result.player);
      commit(next);
      const left = remainingForRole(
        statsRef.current?.roles ?? [],
        next.drawn.map((item) => item.mantraRoles),
        current.role,
        next.exhaustedRoles,
      );
      return left === 0 ? "exhausted" : "ok";
    } catch (error) {
      if (isAbortError(error)) return "fail";
      const message =
        error instanceof Error ? error.message : "Estrazione fallita";
      if (message === ROLE_EXHAUSTED_ERROR) {
        commit(exhaustRole(sessionRef.current, current.role));
        return "exhausted";
      }
      toast.error(message);
      return "fail";
    } finally {
      if (pickAbortRef.current === controller) pickAbortRef.current = null;
      pendingRef.current = false;
      setPending(false);
    }
  }, [commit]);

  const setRole = useCallback((role: string) => {
    setSession((current) =>
      current.role === role ? current : { ...current, role },
    );
  }, []);

  const undoLast = useCallback(() => {
    if (pendingRef.current) return;
    commit(undoDrawn(sessionRef.current));
  }, [commit]);

  const newExtraction = useCallback(() => {
    commit(resetDrawn(sessionRef.current));
    clearDrawSession();
  }, [commit]);

  const loadStats = useCallback(
    async (signal?: AbortSignal) => {
      setStatsError(null);
      try {
        const next = await getStats(signal);
        if (signal?.aborted) return;
        setStats(next);
        if (next.playerCount === 0) {
          clearDrawSession();
          restoredRef.current = true;
          setHydrated(true);
          return;
        }
        if (!restoredRef.current) {
          const stored = loadDrawSession();
          if (stored) commit(stored);
          else {
            const first = next.roles.find((item) => item.count > 0);
            if (first) commit(emptyDrawSession(first.role));
          }
          restoredRef.current = true;
        }
        setHydrated(true);
      } catch (error) {
        if (signal?.aborted || isAbortError(error)) return;
        setStatsError(
          error instanceof Error ? error.message : "Errore stats",
        );
      }
    },
    [commit],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadStats(controller.signal);
    return () => {
      controller.abort();
      pickAbortRef.current?.abort();
    };
  }, [loadStats]);

  useEffect(() => {
    if (!hydrated) return;
    if (session.drawn.length === 0) {
      clearDrawSession();
      return;
    }
    saveDrawSession(session);
  }, [hydrated, session]);

  const player = sessionPlayer(session);
  const liveRoles = remainingRoleCounts(
    stats?.roles ?? [],
    session.drawn.map((item) => item.mantraRoles),
    session.exhaustedRoles,
  );
  const remaining =
    liveRoles.find((item) => item.role === session.role)?.count ?? 0;

  return {
    stats,
    statsError,
    loadStats,
    pending,
    role: session.role,
    setRole,
    drawn: session.drawn,
    player,
    liveRoles,
    remaining,
    roleExhausted: Boolean(session.role) && remaining === 0,
    deckExhausted:
      (stats?.playerCount ?? 0) > 0 &&
      session.drawn.length > 0 &&
      liveRoles.every((item) => item.count === 0),
    noMantraRoles:
      (stats?.playerCount ?? 0) > 0 &&
      (stats?.roles.every((item) => item.count === 0) ?? false),
    canUndo: session.drawn.length >= 2,
    draw,
    undoLast,
    newExtraction,
  };
}
