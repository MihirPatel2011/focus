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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      {/* Ambient warmth behind the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgb(194 65 12 / 0.07), transparent 70%)",
        }}
      />

      <div className="animate-pop card relative w-full max-w-sm p-7">
        <div className="mb-7 text-center">
          <div className="mb-3 flex items-baseline justify-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 translate-y-px rounded-full bg-ember"
            />
            <span className="font-display text-3xl font-semibold tracking-tight">
              focus
            </span>
          </div>
          <p className="text-sm text-muted">
            {mode === "signin"
              ? "Welcome back. Pick up where you left off."
              : "Create your account — it takes a minute."}
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
            className="input-base"
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
            className="input-base"
          />

          {error && (
            <p className="animate-rise rounded-lg bg-[#b3361b]/8 px-3 py-2 text-sm text-[#9d2f17]">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="mt-1 w-full">
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" /> or
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button
          variant="subtle"
          onClick={() => signInGoogle()}
          className="w-full"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2.1 3.7-5.1 3.7-8.6Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-4.9H1.4v3C3.4 21.4 7.4 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.5c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2v-3H1.4C.5 8.7 0 10.5 0 12.3s.5 3.6 1.4 5.2l3.9-3Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.8c2.2 0 3.7 1 4.6 1.8l3.4-3.3C17.9 1.3 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.4l3.9 3c.9-2.7 3.5-4.6 6.7-4.6Z"
            />
          </svg>
          Continue with Google
        </Button>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            clearError();
          }}
          className="mt-5 w-full text-center text-sm text-muted transition-colors hover:text-ink"
        >
          {mode === "signin"
            ? "No account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
