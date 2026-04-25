import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedUser } from "@/lib/auth-server";
import { createUserProjectDirectory, listUserProjectDirectories, ProjectDirectoryError } from "@/lib/project-directories";
import { projectDirectoryCreateSchema } from "@/lib/project-directory-schemas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const result = await listUserProjectDirectories(decoded.uid);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load project directories.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const body = projectDirectoryCreateSchema.parse(await request.json());
    const result = await createUserProjectDirectory(decoded.uid, body);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid project directory payload.", details: error.flatten() },
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
            : "Unable to create project directory.",
      },
      { status: 500 },
    );
  }
}
