import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AuthError, requireUserId } from "./auth";

interface AuthedContext {
  req: VercelRequest;
  res: VercelResponse;
  userId: string;
}

type AuthedHandler = (ctx: AuthedContext) => Promise<void> | void;

// Wraps a handler with Clerk auth + uniform error handling.
export function withAuth(handler: AuthedHandler) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
      const userId = await requireUserId(req);
      await handler({ req, res, userId });
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      console.error("[api] unhandled error", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Returns false (and sends 405) when the method is not allowed.
export function ensureMethod(
  req: VercelRequest,
  res: VercelResponse,
  methods: string[],
): boolean {
  if (!methods.includes(req.method || "")) {
    res.setHeader("Allow", methods.join(", "));
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}
