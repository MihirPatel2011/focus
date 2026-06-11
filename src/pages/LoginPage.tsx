import { useState } from "react";
import { useAuthStore } from "@/logic/stores/authStore";
import { Button } from "@/components/ui/Button";

/** Login / sign-up gate. Email+password and Google sign-in. */
export function LoginPage() {
  const { signInEmail, signUpEmail, signInGoogle, error, clearError } =
    useAuthStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") await signInEmail(email, password);
      else await signUpEmail(email, password);
    } catch {
      /* error surfaced via store */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-3xl">🎯</div>
          <h1 className="mt-2 text-xl font-semibold">Focus</h1>
          <p className="text-sm text-muted">
            {mode === "signin" ? "Welcome back." : "Create your account."}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError();
            }}
            placeholder="Email"
            className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <input
            type="password"
            required
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError();
            }}
            placeholder="Password"
            className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={busy} className="w-full">
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" /> or{" "}
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button
          variant="subtle"
          onClick={() => signInGoogle()}
          className="w-full"
        >
          Continue with Google
        </Button>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            clearError();
          }}
          className="mt-4 w-full text-center text-sm text-muted hover:text-ink"
        >
          {mode === "signin"
            ? "No account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
