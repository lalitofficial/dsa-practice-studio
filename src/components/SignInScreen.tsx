import { SignInButton, SignUpButton } from "@clerk/react";

export function SignInScreen() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 lg:flex-row">
      {/* Brand / pitch panel */}
      <div className="flex flex-1 flex-col justify-center gap-6 px-8 py-12 lg:px-16">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-indigo-500 font-bold text-white">
            ⌘
          </div>
          <span className="text-lg font-semibold">DSA Mastery Studio</span>
        </div>
        <h1 className="max-w-lg text-3xl font-bold leading-tight sm:text-4xl">
          Practice data structures &amp; algorithms, the focused way.
        </h1>
        <ul className="max-w-md space-y-2 text-slate-400">
          <li>• Curated Striver &amp; AlgoMaster tracks, organized by topic.</li>
          <li>• A built-in editor that autosaves your solutions, per language.</li>
          <li>• Notes, stars, and a revision hub — synced across phone, iPad &amp; Mac.</li>
        </ul>
      </div>

      {/* Auth card */}
      <div className="flex flex-1 items-center justify-center bg-slate-900/40 px-6 py-12">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
          <h2 className="text-xl font-semibold">Get started</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to sync your progress, notes, and saved code across devices.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <SignInButton mode="modal">
              <button className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-indigo-600">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full rounded-lg border border-slate-700 px-4 py-2.5 font-medium text-slate-200 transition-colors hover:bg-slate-800">
                Create account
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </div>
  );
}
