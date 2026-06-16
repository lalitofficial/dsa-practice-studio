import type { VercelRequest } from "@vercel/node";
import { verifyToken } from "@clerk/backend";

export class AuthError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// Verify the Clerk session token sent as `Authorization: Bearer <token>` and
// return the Clerk user id (the JWT `sub` claim).
export async function requireUserId(req: VercelRequest): Promise<string> {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token) throw new AuthError("Missing bearer token");

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new AuthError("CLERK_SECRET_KEY is not configured");

  try {
    const payload = await verifyToken(token, { secretKey });
    if (!payload.sub) throw new AuthError("Token has no subject");
    return payload.sub;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError("Token verification failed");
  }
}
