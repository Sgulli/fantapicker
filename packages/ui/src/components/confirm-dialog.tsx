import type { ComponentProps, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@fantapicker/ui/components/alert-dialog";
import { Button } from "@fantapicker/ui/components/button";

type ConfirmDialogProps = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ComponentProps<typeof Button>["variant"];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void;
  trigger?: ReactNode;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Sì",
  cancelLabel = "No",
  confirmVariant = "default",
  open,
  onOpenChange,
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className="min-h-11"
            variant={confirmVariant}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
