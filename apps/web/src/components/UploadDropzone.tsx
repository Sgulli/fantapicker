import { useId, useRef, useState } from "react";
import { UploadIcon } from "lucide-react";
import { isXlsx, XLSX_ACCEPT } from "@fantapicker/shared";
import { cn } from "@fantapicker/ui/lib/utils";

type UploadDropzoneProps = {
  disabled?: boolean;
  onFile: (file: File) => void;
};

export function UploadDropzone({ disabled, onFile }: UploadDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [over, setOver] = useState(false);

  function take(files: FileList | null) {
    const file = files?.[0];
    if (file && isXlsx(file.name, file.type)) onFile(file);
  }

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  return (
    <div className="relative">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={XLSX_ACCEPT}
        className="pointer-events-none sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        onChange={(event) => {
          take(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        aria-describedby={`${inputId}-hint`}
        className={cn(
          "border-white/20 bg-card/60 flex min-h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors duration-200",
          "outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50",
          over && "border-primary bg-primary/10",
          disabled && "pointer-events-none cursor-not-allowed opacity-50",
        )}
        onClick={openPicker}
        onDragEnter={(event) => {
          event.preventDefault();
          if (disabled) return;
          dragDepth.current += 1;
          setOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (disabled) return;
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current > 0) return;
          dragDepth.current = 0;
          setOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setOver(false);
          if (!disabled) take(event.dataTransfer.files);
        }}
      >
        <UploadIcon aria-hidden="true" />
        <span className="font-heading text-lg">Carica il listone</span>
        <span
          id={`${inputId}-hint`}
          className="text-muted-foreground text-pretty text-sm"
        >
          Trascina qui il file xlsx oppure tocca per sceglierlo
        </span>
      </button>
    </div>
  );
}
