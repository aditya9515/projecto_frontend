import type { NextRequest } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";

export async function requireVerifiedUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const idToken = authorization.slice("Bearer ".length).trim();
  if (!idToken) {
    throw new Error("Unauthorized");
  }

  try {
    return await getAdminAuth().verifyIdToken(idToken, true);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code && ["auth/argument-error", "auth/invalid-id-token", "auth/id-token-expired", "auth/id-token-revoked", "auth/user-disabled", "auth/user-not-found"].includes(code)) {
      throw new Error("Unauthorized");
    }
    throw error;
  }
}
