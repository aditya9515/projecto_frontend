import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { createDesktopAuthToken, getUserProfile, upsertUserProfile } from "@/lib/firestore";
import { addMinutes, createOpaqueToken, nowIso, sha256 } from "@/lib/security";
import type { UserProfileRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const existing = await getUserProfile(decoded.uid);
    const email = existing?.email ?? decoded.email;

    if (!email) {
      return NextResponse.json(
        { error: "Authenticated account is missing an email address." },
        { status: 400 },
      );
    }

    if (!existing) {
      const now = nowIso();
      const fallbackProfile: UserProfileRecord = {
        uid: decoded.uid,
        email,
        displayName: decoded.name ?? email.split("@")[0],
        photoURL: decoded.picture ?? null,
        providers: [decoded.firebase.sign_in_provider],
        createdAt: now,
        updatedAt: now,
      };

      await upsertUserProfile(fallbackProfile);
    }

    const token = createOpaqueToken();
    const tokenHash = sha256(token);
    const expiresAt = addMinutes(5);

    await createDesktopAuthToken({
      id: tokenHash,
      userId: decoded.uid,
      tokenHash,
      expiresAt,
      used: false,
      createdAt: nowIso(),
    });

    return NextResponse.json({ token, expiresAt });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create desktop auth token.",
      },
      { status: 500 },
    );
  }
}
