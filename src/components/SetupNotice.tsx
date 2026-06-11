/** Shown when Firebase env vars are missing — guides first-time setup. */
export function SetupNotice() {
  return (
    <div className="mx-auto flex h-full max-w-lg flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Focus needs Firebase config</h1>
      <p className="text-muted">
        Copy <code className="kbd">.env.example</code> to{" "}
        <code className="kbd">.env</code> and fill in your
        Firebase web config values, then restart the dev server.
      </p>
      <p className="text-muted">
        See the <strong>README</strong> for step-by-step setup (creating the
        Firebase project, enabling Firestore + Auth, and populating the{" "}
        <code className="kbd">VITE_FIREBASE_*</code> variables).
      </p>
    </div>
  );
}
