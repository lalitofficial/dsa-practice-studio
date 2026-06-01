// Shown when VITE_CLERK_PUBLISHABLE_KEY is not configured, so the app gives a
// helpful setup hint instead of a blank screen / crash.
export function MissingClerkKey() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-200">
      <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <h1 className="text-lg font-semibold text-white">Almost there 👋</h1>
        <p className="mt-3 text-sm text-slate-400">
          Add your Clerk publishable key to <code className="text-indigo-300">.env.local</code>:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
{`VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."`}
        </pre>
        <p className="mt-3 text-sm text-slate-400">
          Get a free key at{" "}
          <a className="text-indigo-400 underline" href="https://dashboard.clerk.com" target="_blank" rel="noreferrer">
            dashboard.clerk.com
          </a>
          , then restart the dev server. See <code className="text-indigo-300">README.md</code>.
        </p>
      </div>
    </div>
  );
}
