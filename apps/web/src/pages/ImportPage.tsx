import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircleIcon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@fantapicker/ui/components/alert";
import { Button } from "@fantapicker/ui/components/button";
import { ConfirmDialog } from "@fantapicker/ui/components/confirm-dialog";
import { Spinner } from "@fantapicker/ui/components/spinner";
import { toast } from "@fantapicker/ui/components/sonner";
import { UploadDropzone } from "@/components/UploadDropzone";
import { importXlsx } from "@/lib/api";
import { clearDrawSession } from "@/lib/session";

export function ImportPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function runImport(file: File) {
    setPending(true);
    try {
      const result = await importXlsx(file);
      clearDrawSession();
      toast.success(
        `${result.imported} giocatori importati, ${result.skipped} saltati`,
      );
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import fallito");
    } finally {
      setPending(false);
      setPendingFile(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 sm:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-balance text-3xl sm:text-4xl">Importa listone</h1>
        <p className="text-muted-foreground text-pretty text-sm leading-relaxed sm:text-base">
          Carica Quotazioni_Fantacalcio_Stagione_2026_27.xlsx. Le colonne Excel
          vengono normalizzate nel database.
        </p>
      </div>
      <Alert>
        <AlertCircleIcon />
        <AlertTitle>Sostituisce il listone attuale</AlertTitle>
        <AlertDescription>
          Ogni import cancella i giocatori già presenti e ricarica il file da
          zero.
        </AlertDescription>
      </Alert>
      <UploadDropzone
        disabled={pending}
        onFile={(file) => setPendingFile(file)}
      />
      {pending ? (
        <Button disabled className="min-h-11">
          <Spinner data-icon="inline-start" />
          Import in corso
        </Button>
      ) : null}
      <ConfirmDialog
        open={pendingFile !== null && !pending}
        onOpenChange={(open) => {
          if (!open && !pending) setPendingFile(null);
        }}
        title="Sostituire il listone?"
        description={
          <>
            I giocatori attuali verranno cancellati
            {pendingFile ? ` e sostituiti con ${pendingFile.name}` : ""}.
            L&apos;estrazione in corso si azzera.
          </>
        }
        confirmLabel="Importa"
        cancelLabel="Annulla"
        onConfirm={() => {
          if (pendingFile) void runImport(pendingFile);
        }}
      />
    </div>
  );
}
