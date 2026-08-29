import { useCallback, useEffect, useRef, useState } from "react";
import {
  DECK_EXHAUSTED_ERROR,
  ROLE_EXHAUSTED_ERROR,
  appendDrawn,
  drawPool,
  emptyDrawSession,
  exhaustRole,
  indexPlayers,
  lastDrawnMantraRoles,
  playersInDrawOrder,
  resetDrawn,
  undoDrawn,
  type DrawSessionState,
  type Player,
  type StatsResponse,
} from "@fantapicker/shared";
import { toast } from "@fantapicker/ui/components/sonner";
import { getPlayers, getStats, isAbortError, pickPlayer } from "@/lib/api";
import {
  clearDrawSession,
  loadDrawSession,
  saveDrawSession,
} from "@/lib/session";

export type DrawOutcome = "ok" | "exhausted" | "fail";

async function restoreCatalog(
  stored: DrawSessionState,
  rememberPlayers: (players: Player[]) => void,
  signal?: AbortSignal,
): Promise<boolean> {
  if (stored.drawn.length === 0) return true;
  try {
    const lookup = await getPlayers(stored.drawn, signal);
    if (signal?.aborted) return false;
    rememberPlayers(lookup.players);
    return true;
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) return false;
    toast.error(error instanceof Error ? error.message : "Giocatori non trovati");
    return true;
  }
}

export function useDrawSession() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [session, setSession] = useState<DrawSessionState>(emptyDrawSession());
  const [catalog, setCatalog] = useState<Record<number, Player>>({});
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const sessionRef = useRef(session);
  const catalogRef = useRef(catalog);
  const statsRef = useRef(stats);
  const pendingRef = useRef(false);
  const pickAbortRef = useRef<AbortController | null>(null);
  const restoredRef = useRef(false);
  sessionRef.current = session;
  catalogRef.current = catalog;
  statsRef.current = stats;

  const commit = useCallback((next: DrawSessionState) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const rememberPlayers = useCallback((players: Player[]) => {
    const merged = indexPlayers(players, catalogRef.current);
    if (merged === catalogRef.current) return;
    catalogRef.current = merged;
    setCatalog(merged);
  }, []);

  const clearCatalog = useCallback(() => {
    catalogRef.current = {};
    setCatalog({});
  }, []);

  const draw = useCallback(async (): Promise<DrawOutcome> => {
    const current = sessionRef.current;
    if (pendingRef.current) return "fail";
    pendingRef.current = true;
    setPending(true);
    const controller = new AbortController();
    pickAbortRef.current = controller;
    try {
      const result = await pickPlayer(
        current.role,
        current.drawn,
        controller.signal,
      );
      rememberPlayers([result.player]);
      const next = appendDrawn(current, result.player.playerId);
      commit(next);
      const pool = drawPool(statsRef.current, {
        role: current.role,
        drawnCount: next.drawn.length,
        drawnPlayers: playersInDrawOrder(next.drawn, catalogRef.current),
        exhaustedRoles: next.exhaustedRoles,
      });
      return pool.poolEmpty ? "exhausted" : "ok";
    } catch (error) {
      if (isAbortError(error)) return "fail";
      const message =
        error instanceof Error ? error.message : "Estrazione fallita";
      if (message === ROLE_EXHAUSTED_ERROR) {
        if (current.role) commit(exhaustRole(sessionRef.current, current.role));
        return "exhausted";
      }
      if (message === DECK_EXHAUSTED_ERROR) return "exhausted";
      toast.error(message);
      return "fail";
    } finally {
      if (pickAbortRef.current === controller) pickAbortRef.current = null;
      pendingRef.current = false;
      setPending(false);
    }
  }, [commit, rememberPlayers]);

  const setRole = useCallback((role: string) => {
    setSession((current) =>
      current.role === role ? current : { ...current, role },
    );
  }, []);

  const undoLast = useCallback(() => {
    if (pendingRef.current) return;
    commit(
      undoDrawn(sessionRef.current, lastDrawnMantraRoles(sessionRef.current, catalogRef.current)),
    );
  }, [commit]);

  const newExtraction = useCallback(() => {
    clearCatalog();
    commit(resetDrawn(sessionRef.current));
    clearDrawSession();
  }, [clearCatalog, commit]);

  const loadStats = useCallback(
    async (signal?: AbortSignal) => {
      setStatsError(null);
      try {
        const next = await getStats(signal);
        if (signal?.aborted) return;
        setStats(next);
        if (next.playerCount === 0) {
          clearCatalog();
          clearDrawSession();
          restoredRef.current = true;
          setHydrated(true);
          return;
        }
        if (!restoredRef.current) {
          const stored = loadDrawSession();
          if (stored) {
            if (!(await restoreCatalog(stored, rememberPlayers, signal))) return;
            commit(stored);
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
    [clearCatalog, commit, rememberPlayers],
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

  const drawn = playersInDrawOrder(session.drawn, catalog);
  const pool = drawPool(stats, {
    role: session.role,
    drawnCount: session.drawn.length,
    drawnPlayers: drawn,
    exhaustedRoles: session.exhaustedRoles,
  });

  return {
    stats,
    statsError,
    loadStats,
    pending,
    role: session.role,
    setRole,
    drawn,
    player: drawn.at(-1) ?? null,
    pool,
    noMantraRoles:
      (stats?.playerCount ?? 0) > 0 &&
      (stats?.roles.every((item) => item.count === 0) ?? false),
    canUndo: session.drawn.length >= 2,
    draw,
    undoLast,
    newExtraction,
  };
}
