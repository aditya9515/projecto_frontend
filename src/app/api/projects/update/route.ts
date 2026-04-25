import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedUser } from "@/lib/auth-server";
import { ProjectDirectoryError, updateUserProjectDirectory } from "@/lib/project-directories";
import { projectDirectoryUpdateSchema } from "@/lib/project-directory-schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const body = projectDirectoryUpdateSchema.parse(await request.json());
    const result = await updateUserProjectDirectory(decoded.uid, body.projectId, body);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid project update payload.", details: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof ProjectDirectoryError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update project directory.",
      },
      { status: 500 },
    );
  }
}
