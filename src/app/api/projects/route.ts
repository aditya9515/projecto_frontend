import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { createUserProjectDirectory, listUserProjectDirectories } from "@/lib/project-directories";
import { projectDirectoryCreateSchema } from "@/lib/project-directory-schemas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const result = await listUserProjectDirectories(decoded.uid);

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", undefined);
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const body = projectDirectoryCreateSchema.parse(await request.json());
    const result = await createUserProjectDirectory(decoded.uid, body);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", undefined);
  }
}
