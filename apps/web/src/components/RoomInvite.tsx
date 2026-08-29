import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@fantapicker/ui/components/button";
import { toast } from "@fantapicker/ui/components/sonner";

type RoomInviteProps = {
  code: string;
  joinUrl: string;
  defaultOpen?: boolean;
};

export function RoomInvite({
  code,
  joinUrl,
  defaultOpen = false,
}: RoomInviteProps) {
  const [open, setOpen] = useState(defaultOpen);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("Link copiato");
    } catch {
      toast.error("Copia non riuscita");
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Nascondi invito" : "Invita"}
      </Button>
      {open ? (
        <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-card/40 p-4">
          <p className="font-heading text-3xl tracking-[0.35em]">{code}</p>
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG
              value={joinUrl}
              size={220}
              level="M"
              marginSize={2}
              title="Entra nella stanza"
              bgColor="#ffffff"
              fgColor="#0F0F23"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full"
            onClick={() => void copyLink()}
          >
            Copia link
          </Button>
        </div>
      ) : null}
    </div>
  );
}
