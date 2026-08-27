import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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
import { authClient } from "@/lib/auth-client";

export function LoginPage() {
  const navigate = useNavigate();
  const { data, isPending: sessionPending } = authClient.useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sessionPending) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (data) return <Navigate to="/import" replace />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      setError("Email o password non validi");
      setPending(false);
      return;
    }
    navigate("/import", { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 sm:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Accedi</CardTitle>
          <CardDescription>
            Accesso riservato all&apos;import del listone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  className="h-11 min-h-11"
                  aria-invalid={error ? true : undefined}
                />
              </Field>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  className="h-11 min-h-11"
                  aria-invalid={error ? true : undefined}
                />
                {error ? <FieldError>{error}</FieldError> : null}
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={pending}
                  className="min-h-11 w-full"
                >
                  {pending ? <Spinner data-icon="inline-start" /> : null}
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
