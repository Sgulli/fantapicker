import { useEffect, useState, type MouseEvent } from "react";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { ChevronDownIcon } from "lucide-react";
import type { Player } from "@fantapicker/shared";
import { Button } from "@fantapicker/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@fantapicker/ui/components/collapsible";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@fantapicker/ui/components/pagination";
import { cn } from "@fantapicker/ui/lib/utils";
import { HOTKEYS, overlayOpen } from "@/lib/hotkeys";

const PAGE_SIZE = 8;

function pageTokens(current: number, total: number): (number | "gap")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  const tokens: (number | "gap")[] = [1];
  if (start > 2) tokens.push("gap");
  for (let i = start; i <= end; i++) tokens.push(i);
  if (end < total - 1) tokens.push("gap");
  tokens.push(total);
  return tokens;
}

export function DrawnList({ drawn }: { drawn: Player[] }) {
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(drawn.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  useEffect(() => {
    if (drawn.length === 0) {
      setPage(1);
      return;
    }
    setPage((current) => Math.min(current, pageCount));
  }, [drawn.length, pageCount]);

  function goTo(next: number) {
    if (next < 1 || next > pageCount || next === currentPage) return;
    setPage(next);
  }

  useHotkeys(
    [
      {
        hotkey: HOTKEYS.toggleDrawn,
        callback: () => {
          if (overlayOpen()) return;
          setOpen((value) => !value);
        },
        options: { meta: { name: "Lista estratti" } },
      },
      {
        hotkey: HOTKEYS.drawnPrev,
        callback: () => {
          if (overlayOpen() || !open) return;
          goTo(currentPage - 1);
        },
        options: { enabled: pageCount > 1, meta: { name: "Pagina precedente" } },
      },
      {
        hotkey: HOTKEYS.drawnNext,
        callback: () => {
          if (overlayOpen() || !open) return;
          goTo(currentPage + 1);
        },
        options: { enabled: pageCount > 1, meta: { name: "Pagina successiva" } },
      },
    ],
    { enabled: drawn.length > 0, ignoreInputs: true, requireReset: true },
  );

  if (drawn.length === 0) return null;
  const newestFirst = [...drawn].reverse();
  const offset = (currentPage - 1) * PAGE_SIZE;
  const items = newestFirst.slice(offset, offset + PAGE_SIZE);
  const atFirst = currentPage === 1;
  const atLast = currentPage === pageCount;

  function onPageClick(next: number) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      goTo(next);
    };
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="flex w-full max-w-sm flex-col gap-2"
    >
      <CollapsibleTrigger asChild>
        <Button type="button" variant="outline" className="min-h-11 w-full">
          Estratti ({drawn.length})
          <ChevronDownIcon
            data-icon="inline-end"
            className="transition-transform in-data-[state=open]:rotate-180"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2">
        <ol
          reversed
          start={drawn.length - offset}
          className="flex flex-col gap-1"
        >
          {items.map((item) => (
            <li
              key={item.playerId}
              className="text-foreground/90 truncate text-sm"
            >
              {item.name}
            </li>
          ))}
        </ol>
        {pageCount > 1 ? (
          <Pagination aria-label="Paginazione estratti">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="Precedente"
                  aria-label="Pagina precedente"
                  aria-disabled={atFirst}
                  tabIndex={atFirst ? -1 : undefined}
                  className={cn("min-h-11", atFirst && "pointer-events-none opacity-50")}
                  onClick={onPageClick(currentPage - 1)}
                />
              </PaginationItem>
              {pageTokens(currentPage, pageCount).map((token, index) =>
                token === "gap" ? (
                  <PaginationItem key={`gap-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={token}>
                    <PaginationLink
                      href="#"
                      isActive={token === currentPage}
                      aria-label={`Pagina ${token}`}
                      className="min-h-11 min-w-11"
                      onClick={onPageClick(token)}
                    >
                      {token}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Successiva"
                  aria-label="Pagina successiva"
                  aria-disabled={atLast}
                  tabIndex={atLast ? -1 : undefined}
                  className={cn("min-h-11", atLast && "pointer-events-none opacity-50")}
                  onClick={onPageClick(currentPage + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
