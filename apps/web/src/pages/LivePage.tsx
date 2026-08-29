import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isRoomCode, normalizeRoomCode } from "@fantapicker/shared";
import { Button } from "@fantapicker/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@fantapicker/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@fantapicker/ui/components/field";
import { Input } from "@fantapicker/ui/components/input";
import { Spinner } from "@fantapicker/ui/components/spinner";
import { createRoom } from "@/lib/api";
import { saveHostToken } from "@/lib/host-token";

export function LivePage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  async function onCreate() {
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createRoom();
      saveHostToken(created.code, created.hostToken);
      navigate(`/s/${created.code}`, { state: { created: true } });
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Creazione fallita",
      );
      setCreating(false);
    }
  }

  function onJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = normalizeRoomCode(String(form.get("code") ?? ""));
    if (!isRoomCode(code)) {
      setJoinError("Codice non valido");
      return;
    }
    setJoinError(null);
    navigate(`/s/${code}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 sm:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Stanza live</CardTitle>
          <CardDescription>
            Crea una stanza e condividi codice o QR. Solo tu comandi
            l&apos;estrazione.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <Button
                type="button"
                className="min-h-11 w-full"
                disabled={creating}
                onClick={() => void onCreate()}
              >
                {creating ? <Spinner data-icon="inline-start" /> : null}
                Crea stanza
              </Button>
              {createError ? <FieldError>{createError}</FieldError> : null}
            </Field>
          </FieldGroup>
          <form onSubmit={onJoin}>
            <FieldGroup>
              <Field data-invalid={joinError ? true : undefined}>
                <FieldLabel htmlFor="code">Entra con codice</FieldLabel>
                <Input
                  id="code"
                  name="code"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={8}
                  className="h-11 min-h-11 tracking-[0.3em] uppercase"
                  aria-invalid={joinError ? true : undefined}
                />
                {joinError ? <FieldError>{joinError}</FieldError> : null}
              </Field>
              <Field>
                <Button
                  type="submit"
                  variant="outline"
                  className="min-h-11 w-full"
                >
                  Entra
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
