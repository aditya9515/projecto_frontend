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

  return getAdminAuth().verifyIdToken(idToken);
}
