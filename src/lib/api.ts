import { useCallback } from "react";
import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { Problem, ProgressPatch, RevisionItem, Sheet } from "./types";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Returns an authed fetch helper that attaches the Clerk session token. */
export function useAuthedFetch() {
  const { getToken } = useAuth();
  return useCallback(
    async <T>(path: string, init?: RequestInit): Promise<T> => {
      const token = await getToken();
      const res = await fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.headers || {}),
        },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new ApiError(res.status, body.error || `Request failed (${res.status})`);
      }
      return (await res.json()) as T;
    },
    [getToken],
  );
}

// ---- Queries ----

export function useSheets() {
  const fetcher = useAuthedFetch();
  return useQuery({
    queryKey: ["sheets"],
    queryFn: () => fetcher<{ sheets: Sheet[] }>("/api/sheets"),
    select: (d) => d.sheets,
  });
}

export function useProblems(sheetId: string | undefined) {
  const fetcher = useAuthedFetch();
  return useQuery({
    queryKey: ["problems", sheetId],
    queryFn: () =>
      fetcher<{ problems: Problem[] }>(`/api/problems?sheet=${encodeURIComponent(sheetId!)}`),
    select: (d) => d.problems,
    enabled: !!sheetId,
  });
}

export function useProblem(problemId: string | undefined) {
  const fetcher = useAuthedFetch();
  return useQuery({
    queryKey: ["problem", problemId],
    queryFn: () => fetcher<{ problem: Problem }>(`/api/problem/${problemId}`),
    select: (d) => d.problem,
    enabled: !!problemId,
  });
}

export function useRevision() {
  const fetcher = useAuthedFetch();
  return useQuery({
    queryKey: ["revision"],
    queryFn: () => fetcher<{ items: RevisionItem[] }>("/api/revision"),
    select: (d) => d.items,
  });
}

export function useSolutions(problemId: string | undefined) {
  const fetcher = useAuthedFetch();
  return useQuery({
    queryKey: ["solutions", problemId],
    queryFn: () =>
      fetcher<{ solutions: Record<string, string> }>(`/api/solutions/${problemId}`),
    select: (d) => d.solutions,
    enabled: !!problemId,
  });
}

// ---- Mutations ----

interface ProgressVars {
  problemId: string;
  sheetId: string;
  patch: ProgressPatch;
}

function patchProblemCaches(
  qc: QueryClient,
  problemId: string,
  sheetId: string,
  patch: ProgressPatch,
) {
  qc.setQueryData<{ problems: Problem[] }>(["problems", sheetId], (old) =>
    old
      ? { problems: old.problems.map((p) => (p.id === problemId ? { ...p, ...patch } : p)) }
      : old,
  );
  qc.setQueryData<{ problem: Problem }>(["problem", problemId], (old) =>
    old ? { problem: { ...old.problem, ...patch } } : old,
  );
}

export function useUpdateProgress() {
  const fetcher = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ problemId, patch }: ProgressVars) =>
      fetcher(`/api/progress/${problemId}`, {
        method: "POST",
        body: JSON.stringify(patch),
      }),
    onMutate: async ({ problemId, sheetId, patch }) => {
      await qc.cancelQueries({ queryKey: ["problems", sheetId] });
      await qc.cancelQueries({ queryKey: ["problem", problemId] });
      const prevList = qc.getQueryData(["problems", sheetId]);
      const prevOne = qc.getQueryData(["problem", problemId]);
      patchProblemCaches(qc, problemId, sheetId, patch);
      return { prevList, prevOne, sheetId, problemId };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData(["problems", ctx.sheetId], ctx.prevList);
      qc.setQueryData(["problem", ctx.problemId], ctx.prevOne);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["sheets"] });
      qc.invalidateQueries({ queryKey: ["revision"] });
    },
  });
}

interface SaveSolutionVars {
  problemId: string;
  language: string;
  code: string;
}

export function useSaveSolution() {
  const fetcher = useAuthedFetch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ problemId, language, code }: SaveSolutionVars) =>
      fetcher(`/api/solutions/${problemId}`, {
        method: "PUT",
        body: JSON.stringify({ language, code }),
      }),
    onSuccess: (_data, { problemId, language, code }) => {
      qc.setQueryData<{ solutions: Record<string, string> }>(
        ["solutions", problemId],
        (old) => ({ solutions: { ...(old?.solutions || {}), [language]: code } }),
      );
    },
  });
}
