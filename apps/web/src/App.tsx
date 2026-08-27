import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { cn } from "@fantapicker/ui/lib/utils";
import { Toaster } from "@fantapicker/ui/components/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { authClient } from "@/lib/auth-client";
import { ImportPage } from "@/pages/ImportPage";
import { LoginPage } from "@/pages/LoginPage";
import { PickerPage } from "@/pages/PickerPage";

function navClass(isActive: boolean) {
  return cn(
    "inline-flex min-h-11 items-center justify-center rounded-md px-3 py-2 text-sm transition-colors duration-200 hover:bg-muted",
    isActive && "bg-muted text-primary font-medium",
  );
}

function AppNav() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  async function logout() {
    await authClient.signOut();
    navigate("/");
  }

  return (
    <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principale">
      <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>
        Estrai
      </NavLink>
      {session ? (
        <>
          <NavLink
            to="/import"
            className={({ isActive }) => navClass(isActive)}
          >
            Importa
          </NavLink>
          <button
            type="button"
            className={navClass(false)}
            onClick={() => void logout()}
          >
            Esci
          </button>
        </>
      ) : (
        <NavLink to="/login" className={({ isActive }) => navClass(isActive)}>
          Accedi
        </NavLink>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <div className="relative isolate min-h-dvh overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="bg-secondary/40 absolute -top-24 left-[-10%] size-72 rounded-full blur-3xl motion-reduce:hidden" />
        <div className="bg-primary/20 absolute top-40 right-[-8%] size-80 rounded-full blur-3xl motion-reduce:hidden" />
      </div>
      <a
        href="#main"
        className="bg-primary text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20 focus:rounded-md focus:px-3 focus:py-2"
      >
        Salta al contenuto
      </a>
      <header className="border-white/10 bg-background/70 sticky top-0 z-10 border-b pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-3">
          <p className="font-heading text-base tracking-wide sm:text-lg">
            FantaPicker
          </p>
          <AppNav />
        </div>
      </header>
      <main
        id="main"
        className="relative mx-auto w-full max-w-5xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-10"
      >
        <Routes>
          <Route path="/" element={<PickerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/import"
            element={
              <RequireAuth>
                <ImportPage />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
}
