import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "@fantapicker/ui/components/spinner";
import { authClient } from "@/lib/auth-client";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();
  if (isPending) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!data) return <Navigate to="/login" replace />;
  return children;
}
