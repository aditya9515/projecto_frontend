import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedUser } from "@/lib/auth-server";
import { getUserProfile, upsertUserProfile } from "@/lib/firestore";
import { nowIso } from "@/lib/security";
import type { UserProfileRecord } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().trim().min(1).optional(),
  photoURL: z.string().nullable().optional(),
  providers: z.array(z.string()).default([]),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const parsed = bodySchema.parse(await request.json());
    const existing = await getUserProfile(decoded.uid);
    const email = decoded.email ?? parsed.email;

    if (!email) {
      return NextResponse.json(
        { error: "Authenticated user does not have an email address." },
        { status: 400 },
      );
    }

    const now = nowIso();
    const providers = Array.from(
      new Set(
        [
          ...(existing?.providers ?? []),
          ...parsed.providers,
          decoded.firebase.sign_in_provider,
        ].filter(Boolean),
      ),
    );

    const record: UserProfileRecord = {
      uid: decoded.uid,
      email,
      displayName:
        parsed.displayName ??
        existing?.displayName ??
        decoded.name ??
        email.split("@")[0],
      photoURL:
        parsed.photoURL ??
        existing?.photoURL ??
        decoded.picture ??
        null,
      providers,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await upsertUserProfile(record);

    return NextResponse.json({ user: record });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorized();
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload.", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to sync account profile.",
      },
      { status: 500 },
    );
  }
}
