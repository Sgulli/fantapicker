import { useEffect, useState } from "react";
import type { Player } from "@fantapicker/shared";
import { mantraRoleLabel } from "@fantapicker/shared";
import { Badge } from "@fantapicker/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@fantapicker/ui/components/card";

type PlayerCardProps = {
  player: Player;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function PlayerCard({ player }: PlayerCardProps) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [player.playerId]);

  return (
    <Card className="w-full shrink-0 border-white/10 bg-card/80 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.8)] ring-1 ring-white/10 backdrop-blur-sm">
      <div className="bg-muted relative mx-auto aspect-3/4 w-full max-w-52 overflow-hidden rounded-xl">
        {broken ? (
          <div className="text-muted-foreground flex size-full items-center justify-center text-3xl">
            {initials(player.name)}
          </div>
        ) : (
          <img
            src={player.imageUrl}
            alt={`Campioncino di ${player.name}`}
            width={208}
            height={277}
            className="size-full object-contain"
            onError={() => setBroken(true)}
          />
        )}
      </div>
      <CardHeader className="w-full items-center text-center">
        <CardTitle className="font-heading text-pretty px-1 text-xl sm:text-2xl">
          {player.name}
        </CardTitle>
        <CardDescription className="px-1">
          {player.team ?? "Svincolato"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-2">
        {player.mantraRoles.map((role) => (
          <Badge key={role} variant="secondary">
            {mantraRoleLabel(role)}
          </Badge>
        ))}
      </CardContent>
      <CardFooter className="justify-center gap-8 border-white/10">
        <dl className="flex gap-8 text-sm">
          <div className="flex flex-col items-center">
            <dt className="text-muted-foreground">FVM</dt>
            <dd className="text-foreground text-lg font-medium tabular-nums">
              {player.fvm ?? "—"}
            </dd>
          </div>
          <div className="flex flex-col items-center">
            <dt className="text-muted-foreground">Qt.A</dt>
            <dd className="text-foreground text-lg font-medium tabular-nums">
              {player.quotationCurrent ?? "—"}
            </dd>
          </div>
        </dl>
      </CardFooter>
    </Card>
  );
}
