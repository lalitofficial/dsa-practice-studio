import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Show } from "@clerk/react";
import { AppShell } from "./components/AppShell";
import { SignInScreen } from "./components/SignInScreen";
import { CenteredMessage, Spinner } from "./components/ui";

// Code-split routes so the heavy editor (CodeMirror + language packs) only
// loads when a problem is opened — keeps first paint light on mobile.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SheetView = lazy(() => import("./pages/SheetView"));
const ProblemView = lazy(() => import("./pages/ProblemView"));
const Revision = lazy(() => import("./pages/Revision"));

export default function App() {
  return (
    <>
      <Show when="signed-in">
        <AppShell>
          <Suspense
            fallback={
              <CenteredMessage>
                <Spinner />
              </CenteredMessage>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sheet/:sheetId" element={<SheetView />} />
              <Route path="/problem/:problemId" element={<ProblemView />} />
              <Route path="/revision" element={<Revision />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      </Show>
      <Show when="signed-out">
        <SignInScreen />
      </Show>
    </>
  );
}
